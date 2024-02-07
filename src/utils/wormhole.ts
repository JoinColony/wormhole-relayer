import { ethers } from "ethers";

export const chainIdToWormholeChainId = (chainId: string): string => {
  console.log(chainId, typeof chainId, chainId === "80001");
  if (chainId === "137" || chainId === "80001") {
    return "5"; // Polygon, both mainnet and testnet
  } else if (chainId === "10" || chainId === "420") {
    return "24"; // Optimism, both mainet and testnet
  } else {
    throw new Error(`Chain ID ${chainId} not supported`);
  }
};

// See https://docs.wormhole.com/wormhole/blockchain-environments/evm#addresses
export const addressToWormholeAddress = (address: string): string => {
  return ethers.utils.hexZeroPad(address, 32).slice(2).toLowerCase();
};