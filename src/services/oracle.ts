import { config } from '../config/index.js';
import {
  getServer,
  invokeContract,
  scValToNative,
  symbolToScVal,
  i128ToScVal,
  u64ToScVal,
} from './stellar.js';
import type { PriceFeed, ApiResponse } from '../types/index.js';
import { logger } from '../config/logger.js';

export async function getOraclePrice(feedId: string): Promise<ApiResponse<PriceFeed>> {
  try {
    const simulated = await invokeContract(
      config.contracts.oracle,
      'get_price',
      [symbolToScVal(feedId)]
    );

    if ('result' in simulated) {
      const result = scValToNative<{ feed_id: string; price: string; decimals: number; timestamp: string; round_id: string }>(
        simulated.result.retval
      );

      return {
        success: true,
        data: {
          feedId: result.feed_id,
          price: result.price,
          decimals: result.decimals,
          timestamp: parseInt(result.timestamp),
          roundId: parseInt(result.round_id),
        },
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed - no result',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to get oracle price', { feedId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function listOracleFeeds(): Promise<ApiResponse<string[]>> {
  try {
    const simulated = await invokeContract(
      config.contracts.oracle,
      'list_feeds',
      []
    );

    if ('result' in simulated) {
      const feeds = scValToNative<string[]>(simulated.result.retval);
      return {
        success: true,
        data: feeds,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to list oracle feeds', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function submitOraclePrice(
  feedId: string,
  price: string,
  roundId: number
): Promise<ApiResponse<void>> {
  try {
    await invokeContract(
      config.contracts.oracle,
      'submit_price',
      [symbolToScVal(feedId), i128ToScVal(price), u64ToScVal(roundId)]
    );

    return {
      success: true,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to submit oracle price', { feedId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
