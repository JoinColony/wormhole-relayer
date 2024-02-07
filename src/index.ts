import 'cross-fetch/polyfill';

import dotenv from 'dotenv';
import { utils } from 'ethers';

import { startBlockListeners } from '~blockListener';
import { startTxBridgers } from '~txBridger';
import { initialiseProviders } from '~providers';
import { startStatsServer } from '~stats';
import {
  setupListenersForBridges,
} from '~eventListeners';
import { loadConfig } from '~utils/config';

dotenv.config();
utils.Logger.setLogLevel(utils.Logger.levels.ERROR);

const start = async (): Promise<void> => {
  loadConfig();
  /**
   * Set up providers for the chains we care about
   *
   */
  await initialiseProviders();

  // await amplifyClientSetup();
  /**
   * Start express server providing stats and fetch existing stats from the DB
   */
  await startStatsServer();

  // /**
  //  * Setup the listeners we care about for bridge contracts
  //  */
  await setupListenersForBridges();
  // await setupListenersForExtensions();

  // /**
  //  * Start the main block listeners
  //  */
  startBlockListeners();

  // /**
  //  * Start the listeners looking for transactions to bridge
  //  */
  startTxBridgers();

  // /**
  //  * In development, where both the chain and the DB gets reset everytime,
  //  * we need to "seed" some initial data, such as versions or the current network fee
  //  * In live environments, these values will already have been saved in the DB
  //  */
  // if (process.env.NODE_ENV === 'development') {
  //   await seedDB();
  // }
};

start();
