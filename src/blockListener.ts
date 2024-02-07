import { output, getLastBlockNumber } from '~utils';
import { Block, EthersObserverEvents } from '~types';
import { processNextBlock } from '~blockProcessor';
import { getProvider } from '~providers';
import { getAllChainIds } from '~utils/config';

/**
 * Map storing blocks that have been either picked up by the block listener
 * or missed blocks tracking
 * @TODO: Explore the possiblity of removing blocks once they've been processed
 */
export const blocksMap = new Map<number, Block>();

export const startBlockListeners = async (): Promise<void> => {
  for (const chainId of getAllChainIds()) {
    startBlockListener(chainId);
  }
};

export const startBlockListener = (chainId: string): void => {
  const provider = getProvider(chainId);
  if (!provider) {
    throw new Error(`No provider found for chain ${chainId}`);
  }
  provider.on(EthersObserverEvents.Block, async (blockNumber: number) => {
    try {
      const block = await provider.getBlock(blockNumber);
      blocksMap.set(block.number, block);

      output(`Block ${blockNumber} added to the queue`);

      processNextBlock(chainId);
    } catch (error) {
      throw new Error(
        `Observed block ${blockNumber} but failed to get its data: ${error}`,
      );
    }
  });

  output('Block listener started');

  trackMissedBlocks(chainId);
};

/**
 * Function fetching all the blocks between the last processed block and the current block
 * that happened when ingestor was not actively listening
 */
const trackMissedBlocks = async (chainId: string): Promise<void> => {
  const lastBlockNumber = getLastBlockNumber(chainId);
  const provider = getProvider(chainId);
  const currentBlockNumber = await provider.getBlockNumber();

  if (lastBlockNumber >= currentBlockNumber) {
    return;
  }

  output(
    `Fetching blocks from block ${
      lastBlockNumber + 1
    } to ${currentBlockNumber}`,
  );

  for (let i = lastBlockNumber + 1; i <= currentBlockNumber; i += 1) {
    const block = await provider.getBlock(i);
    blocksMap.set(i, block);
  }

  processNextBlock(chainId);
};
