import {
  AnyColonyClient,
  AnyVotingReputationClient,
  ColonyNetworkClient,
  TokenClient,
} from '@colony/colony-js';
import { LogDescription } from '@ethersproject/abi';
import { ethers } from 'ethers';

/*
 * Custom contract event, since we need some log values as well
 */
export interface ContractEvent extends LogDescription {
  transactionHash: string;
  logIndex: number;
  contractAddress: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  chainId: string;
  // Optional property that will be set if the event is emitted by an extension
  colonyAddress?: string;
}

/*
 * All contract events signatures we deal with
 */
export enum ContractEventsSignatures {
  WormholeMessagePublished = 'LogMessagePublished(address,uint64,uint32,bytes,uint8)',
  ReputationMiningCycleComplete = 'ReputationMiningCycleComplete(bytes32,uint256)',
}

/*
 * The internal Ethers event names for which we can set listeners
 * (Which for some reason Ethers doesn't export the types for)
 */
export enum EthersObserverEvents {
  Block = 'block',
}

export type ChainID = number;

export type Block = ethers.providers.Block;

export interface AdditionalProperties {
  "chainId": string;
  [key: string]: unknown;
};

export type NetworkClients =
  | ColonyNetworkClient
  | TokenClient
  | AnyColonyClient
  | AnyVotingReputationClient;
