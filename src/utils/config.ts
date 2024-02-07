import { Config, NetworkConfig } from '~types';
import config from '../../config.json';

export const typedConfig : Config = {miningNetwork: '', networks: {}};

export const loadConfig = () : void => {
  typedConfig.miningNetwork = config.miningNetwork;
  for (const network in config.networks) {
    typedConfig.networks[network] = config.networks[network as keyof typeof config.networks];
  }
  if (!typedConfig.networks[typedConfig.miningNetwork]) {
    throw new Error('Mining network not defined in config');
  }
};

export const getNetworkConfig = (chainId: string) : NetworkConfig => {
  const networkConfig = Object.values(typedConfig.networks).find((network) => network.chainId === chainId);
  if (!networkConfig) {
    throw new Error(`No network found for chain ID ${chainId}`);
  }
  return networkConfig;
};

export const getMiningChainId = () : string => {
  return typedConfig.networks[typedConfig.miningNetwork].chainId;
};

export const getAllChainIds = () : string[] => {
  return Object.values(typedConfig.networks).map((network) => network.chainId);
};