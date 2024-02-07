import { chainIdToWormholeChainId } from '~utils';
import prisma from '~db';
import { bridgingTransactions } from '@prisma/client';
import config from 'config.json';
import { parseVaa } from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';
import { getProvider, getWallet } from '~providers';
import { getAllChainIds } from '~utils/config';


export const startTxBridgers = async (): Promise<void> => {
  for (const chainId of getAllChainIds()) {
    startTxBridger(chainId);
  }
};

const txBeingSent = new Map<string, boolean>();

export const startTxBridger = (chainId: string): void => {
  // Every so often, query the database for the first tx that needs bridging to chainId

  setInterval(async () => {
    if (txBeingSent.get(chainId)) {
      return;
    }
    txBeingSent.set(chainId, true);
    const network = Object.values(config.networks).filter((n) => n.chainId === chainId)[0];
    if (!network) {
      throw new Error(`No network found for chain ${chainId}`);
    }

    const provider = getProvider(chainId);
    if (!provider) {
      throw new Error(`No provider found for chain ${chainId}`);
    }
    const tx = await getFirstTxToBridge(chainId);
    console.log(chainId, tx);
    if (tx === null) {
      // Nothing pending, so nothing to do
      return;
    }
    // Actually send the transaction
    // First, get the VAA
    const vaaResponse = await fetch(`${config.wormholeEndpoint}vaas/${tx.fromWormholeChainId}/${tx.sender}/${tx.sequence}`).then((res) => res.json());
    const { vaa } = vaaResponse.data;
    console.log(vaa);
    const parsedVaa = parseVaa(Buffer.from(vaa, 'base64'));
    // Check the emitter address is as expected
    if (parsedVaa.emitterChain.toString(10) !== tx.fromWormholeChainId) {
      throw new Error('VAA emitter chain does not match expected chain');
    }
    if (parsedVaa.sequence.toString() !== tx.sequence) {
      throw new Error('VAA sequence does not match expected sequence');
    }
    console.log(parsedVaa.emitterAddress.toString('hex'), tx.sender);
    if (parsedVaa.emitterAddress.toString('hex') !== tx.sender) {
      throw new Error('VAA emitter address does not match expected sender');
    }

    console.log(parsedVaa);

    // Put together the transaction we are going to send and get the hash
    const wallet = getWallet(chainId);
    const colonyBridge = new ethers.Contract(network.colonyWormholeBridgeAddress, ["function receiveMessage(bytes)"], wallet);

    const populatedTransaction = await colonyBridge.populateTransaction.receiveMessage(Buffer.from(vaa, 'base64'));
    const feeData = await provider.getFeeData();
    if (feeData.maxPriorityFeePerGas && feeData.maxFeePerGas){
      populatedTransaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      populatedTransaction.maxFeePerGas = feeData.maxFeePerGas;
    } else if (feeData.gasPrice){
      populatedTransaction.gasPrice = feeData.gasPrice;
    } else {
      throw new Error('No gas price or fee data available');
    }

    populatedTransaction.chainId = parseInt(network.chainId);
    populatedTransaction.nonce = await wallet.getTransactionCount();
    const gas = await wallet.estimateGas(populatedTransaction);
    populatedTransaction.gasLimit = gas.mul(11).div(10);
    const signedTransaction = await wallet.signTransaction(populatedTransaction);
    const hash = ethers.utils.keccak256(signedTransaction);

    // Store in the database
    await prisma.bridgingTransactions.update({
        where: {
          fromWormholeChainId_sender_sequence: {
            fromWormholeChainId: tx.fromWormholeChainId,
            sender: tx.sender,
            sequence: tx.sequence,
          },
        },
        data: {
          txHashOut: hash,
        },
      });

    // Send the transaction
    const txResponse = await provider.sendTransaction(signedTransaction);
    console.log(txResponse);
    console.log(`Bridging transaction ${hash} mined`);
    txBeingSent.set(chainId, false);
  }, 10000);
};

/**
 * Function fetching the first tx that needs to be bridged to chainId
 */
async function getFirstTxToBridge(chainId: string): Promise<bridgingTransactions | null > {
  const wormholeChainId = chainIdToWormholeChainId(chainId);
  return await prisma.bridgingTransactions.findFirst({
    where: {
      toWormholeChainId: wormholeChainId,
      txHashOut: null,
    },
    // TODO: This probably needs a robust ORDER BY
  });
}
