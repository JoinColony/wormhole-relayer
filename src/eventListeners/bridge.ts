import {
  EventListenerType,
  addEventListener,
} from '~eventListeners';
import { utils } from 'ethers';
import { ContractEventsSignatures } from '~types';
import { getAllChainIds, getNetworkConfig } from '~utils/config';

export const setupListenersForBridges = async (): Promise<void> => {
  for (const chainId of getAllChainIds()) {
    const { wormholeCoreAddress, colonyWormholeBridgeAddress } = getNetworkConfig(chainId);
    const wormholeLogMessagePublishedSignature = "LogMessagePublished(address,uint64,uint32,bytes,uint8)";
    addEventListener({
      type: EventListenerType.Wormhole,
      address: wormholeCoreAddress,
      eventSignature: ContractEventsSignatures.WormholeMessagePublished,
      topics: [utils.id(wormholeLogMessagePublishedSignature), utils.hexZeroPad(colonyWormholeBridgeAddress, 32).toString()],
      chainId,
    });
  };
};

