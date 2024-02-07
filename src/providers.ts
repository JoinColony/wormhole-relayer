import { providers as ethersProviders, Wallet } from 'ethers';
import dotenv from 'dotenv';
import config from '../config.json';

dotenv.config();

const providers: {[key: string]: ethersProviders.Provider } = {};
const wallets: {[key: string]: Wallet } = {};

export const initialiseProviders = async (): Promise<void> => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('No private key found');
  }

  for (const network in config.networks){

    const { rpcUrl, chainId } = config.networks[network as keyof typeof config.networks];
    const rpcProvider = new ethersProviders.JsonRpcProvider(rpcUrl);
    const { chainId: chainIdResponse } = await rpcProvider.getNetwork();
    if (chainId !== chainIdResponse.toString()) {
      throw new Error(
        `Chain ID mismatch for ${network}: ${chainIdResponse} !== ${chainId}`,
      );
    }
    providers[chainId] = rpcProvider;
    wallets[chainId] = new Wallet(process.env.PRIVATE_KEY, rpcProvider);
  }
};

export const getProvider = (chainId: string): ethersProviders.Provider => {
  if (!providers[chainId]) {
    throw new Error(`No provider found for chain ID ${chainId}`);
  }
  return providers[chainId];
};

export const getWallet = (chainId: string): Wallet => {
  if (!wallets[chainId]) {
    throw new Error(`No wallet found for chain ID ${chainId}`);
  }
  return wallets[chainId];
};

export const getAllProviders = (): {[key: string]: ethersProviders.Provider } => {
  return providers;
};

export default providers;