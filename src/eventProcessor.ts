import dotenv from 'dotenv';

import { ContractEventsSignatures, ContractEvent } from './types';
import {
  handleWormholeMessagePublished,
} from './handlers';

dotenv.config();

/*
 * Here's where you'll be handling all your custom logic for the various events
 * this ingestors listens for, and which make their way into the Event Queue
 *
 * Here's an example of how to set up your case:
 *
 * case ContractEventsSignatures.<YourEventName>: {
 *   // your custom logic
 *   return;
 * }
 */
export default async (event: ContractEvent): Promise<void> => {
  if (!event.signature) {
    throw new Error(
      'Event does not have a signature. Possibly bad event data. Refusing the process!',
    );
  }
  switch (event.signature) {

    case ContractEventsSignatures.WormholeMessagePublished: {
      console.log('wormhole');
      await handleWormholeMessagePublished(event);
      return;
    }

    default: {
      return;
    }
  }
};
