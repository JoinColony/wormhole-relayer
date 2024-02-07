export interface Config {
  "miningNetwork": string;
  "networks": {
    [key: string]: NetworkConfig
  }
}

export interface NetworkConfig {
  rpcUrl: string;
  chainId: string;
  wormholeCoreAddress: string;
  colonyWormholeBridgeAddress: string;
  wormholeChainId: string;
}