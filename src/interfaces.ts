import { utils } from 'ethers';

import { EventListener, EventListenerType } from '~eventListeners';

/**
 * Function returning ABI-derived interface for a given event listener type,
 * which is later used for parsing event logs
 */
export const getInterfaceByListener = (
  listener: EventListener,
): utils.Interface | null => {
  const { type: listenerType } = listener;
  const wormholeABI = ["event LogMessagePublished(address indexed sender, uint64 sequence, uint32 nonce, bytes payload, uint8 consistencyLevel)"];

  switch (listenerType) {
    case EventListenerType.Wormhole:
      return new utils.Interface(wormholeABI);
    default: {
      return null;
    }
  }
};
