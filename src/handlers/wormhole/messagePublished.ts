
import { ContractEvent } from '~types';
import { addressToWormholeAddress, chainIdToWormholeChainId } from '~utils/wormhole';
import prisma from '~db';
import { typedConfig as config, getAllChainIds, getMiningChainId } from '~utils/config';



export default async (event: ContractEvent): Promise<void> => {

  // Work out what transaction(s) this message being published means we have to send

  console.log(event);
  if (typeof config.miningNetwork !== 'string') {
    throw new Error('Mining network not defined in config');
  }
  const onMiningChain = event.chainId === getMiningChainId();
  const wormholeChainId = chainIdToWormholeChainId(event.chainId);
  const senderWormholeAddress = addressToWormholeAddress(event.args.sender);

  // We use upserts here so that if we restarted during processing a block, we don't end up re-bridging something,
  // and don't end up erroring out there.
  if (!onMiningChain) {
    const toWormholeChainId = chainIdToWormholeChainId(getMiningChainId());
    try {
      await prisma.bridgingTransactions.upsert({
        where: {
          fromWormholeChainId_sender_sequence: {
            fromWormholeChainId: wormholeChainId,
            sender: senderWormholeAddress,
            sequence: event.args.sequence.toString(),
          },
        },
        create: {
          fromWormholeChainId: wormholeChainId,
          sender: senderWormholeAddress,
          txHashIn: event.transactionHash,
          logIndexIn: event.logIndex,
          toWormholeChainId,
          sequence: event.args.sequence.toString(),
        },
        update: {
        },
      });
    } catch (error) {
      console.error('Error creating bridging transaction', error);
      throw error;
    }
  } else {
    // We're assuming for now that anything published on the mining chain needs to be sent to
    // all other chains.
    for (const chainId of getAllChainIds()) {
      const miningChainId = getMiningChainId();
      if (chainId === miningChainId) {
        continue;
      }
      const toWormholeChainId = chainIdToWormholeChainId(chainId);
      try {
        await prisma.bridgingTransactions.upsert({
          where: {
            fromWormholeChainId_sender_sequence: {
              fromWormholeChainId: wormholeChainId,
              sender: senderWormholeAddress,
              sequence: event.args.sequence.toString(),
            },
          },
          create: {
            fromWormholeChainId: wormholeChainId,
            sender: senderWormholeAddress,
            txHashIn: event.transactionHash,
            logIndexIn: event.logIndex,
            toWormholeChainId,
            sequence: event.args.sequence.toString(),
          },
          update: {
          },
        });
      } catch (error) {
        console.error('Error creating bridging transaction', error);
        throw error;
      }
    }
  }
};

