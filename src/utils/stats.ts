import fs from 'fs';

import { output, verbose } from './logger';

import config from '../../config.json';

interface Stats {
  lastBlockNumbers?: { [key: string]: number };
  [key: string]: unknown;
}

let stats: Stats = {};

type ObjectOrFunction =
  | Stats
  | ((jsonFile: Stats) => Stats);

/*
 * Update stats with a given argument
 * It accepts either a object fragment (or full object) that will get appended to the stats,
 * or a callback (which receives the current stats) and needs to return the new object
 * that will be written back
 */
export const updateStats = async (
  objectOrFunction: ObjectOrFunction,
): Promise<void> => {
  if (typeof objectOrFunction === 'function') {
    const fRes = objectOrFunction(stats);
    stats = {
      ...stats,
      ...fRes,
      lastBlockNumbers: {
        ...stats.lastBlockNumbers,
        ...fRes.lastBlockNumbers,
      },
    };
  } else {
    stats = {
      ...stats,
      ...objectOrFunction,
      lastBlockNumbers: {
        ...stats.lastBlockNumbers,
        ...objectOrFunction.lastBlockNumbers,
      },
    };
  }

  fs.writeFileSync('./stats.txt', JSON.stringify(stats));

  // await mutate<UpdateStatsMutation, UpdateStatsMutationVariables>(
  //   UpdateStatsDocument,
  //   {
  //     value: JSON.stringify(stats),
  //   },
  // );

  verbose('Stats file updated');
};

// This exists as a function to prevent accidental overwriting of the `stats` variable
export const getStats = (): typeof stats => ({ ...stats });

export const getLastBlockNumber = (chainId: string): number => {
  if (chainId === undefined) {
    throw new Error('Chain ID is undefined');
  }
  if (Number.isInteger(stats.lastBlockNumbers?.[chainId])) {
    return Number(stats.lastBlockNumbers?.[chainId]);
  }
  /*
   * @NOTE This prevents accidental database stats overwriting if the API / GraphQL
   * endpoint is not accessible
   *
   * It will throw the block ingestor (the pod that it's running on) into an restart
   * loop until the API is accessible again
   */
  throw new Error('Could not get last block number from stats. Aborting.');
};

export const setLastBlockNumber = (chainId: string, lastBlockNumber: number): void => {
  updateStats({ lastBlockNumbers: { [chainId]: lastBlockNumber }});
};

/**
 * Function fetching the last stored stats from the DB
 * If no stats entry is found, it will create one
 */
export const initStats = async (): Promise<void> => {
  let fileContents;
  try {
    fileContents = fs.readFileSync('./stats.txt', 'utf8');
  } catch (err) {
    output('Could not read stats from the file. Creating a new one.');


    for (const network in config.networks) {
      const { chainId } = config.networks[network as keyof typeof config.networks];
      stats.lastBlockNumbers = {
        ...stats.lastBlockNumbers,
        [chainId]: 0,
      };
    }

    fs.writeFileSync('./stats.txt', JSON.stringify(stats));
    return;
  }
  if (fileContents) {
    try {
      stats = JSON.parse(fileContents);
      return;
    } catch {
      output(
        'Could not parse stats from the file. The value is not a valid JSON.',
      );
    }
  }
};
