import express from 'express';

import { getLastBlockNumber, getStats, initStats, output } from '~utils';
import { getListenersStats } from '~eventListeners';
import { getAllChainIds } from '~utils/config';

export const coloniesSet = new Set<string>();

const app = express();
const port = process.env.STATS_PORT;

app.get('/', (_, res) => {
  res
    .type('text/plain')
    .send(process.env.NODE_ENV !== 'production' ? 'Block Ingestor' : '');
});

/*
 * Use to check if service is alive
 */
app.get('/liveness', (_, res) => res.sendStatus(200));

/*
 * Use to check various service stats
 */
app.get('/stats', async (_, res) => {
  const stats = getStats();
  res.type('json').send(stats);
});

/**
 * Use to check currently active listeners
 */
app.get('/listeners', async (_, res) => {
  res.type('json').send(getListenersStats());
});

export const startStatsServer = async (): Promise<void> => {
  await initStats();

  if (!port) {
    return;
  }

  for (const chainId of getAllChainIds()) {
    output('Wormhole relay started on chain', chainId);
    output(`Last processed block number: ${getLastBlockNumber(chainId)}`);
  }

  app.listen(port, async () => {
    output(`Stats available at http://localhost:${port}/stats`);
    output(`Liveness check available at http://localhost:${port}/liveness`);
  });
};
