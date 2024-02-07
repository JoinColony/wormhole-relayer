import { verbose } from '~utils';

import { EventListener } from './types';
import { AdditionalProperties } from '~types';

let listeners: EventListener[] = [];

export const getEventListeners = (): EventListener[] => listeners;

export const setEventListeners = (newListeners: EventListener[]): void => {
  listeners = newListeners;
};

export const addEventListener = (listener: EventListener): void => {
  verbose(
    `Added listener for event ${listener.eventSignature}`,
    listener.address ? `filtering address ${listener.address}` : '',
    `on chain ${listener.chainId}`,
  );
  listeners.push(listener);
};

export const getMatchingListener = (
  logTopics: string[],
  logAddress: string,
): EventListener | null => {
  return (
    listeners.find((listener) => {
      if (listener.address && logAddress !== listener.address) {
        return false;
      }
      return listener.topics.every((topic, index) => {
        if (topic === null) {
          // if listener topic is null, skip the check
          return true;
        }

        return topic.toLowerCase() === logTopics[index].toLowerCase();
      });
    }) ?? null
  );
};

export const getListenersStats = (): string => JSON.stringify(listeners);

export const getAdditionalContractEventProperties = (
  listener: EventListener,
): AdditionalProperties => {
  return { chainId: listener.chainId };
};
