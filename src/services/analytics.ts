import { config } from '../config/index.js';
import {
  invokeContract,
  scValToNative,
  symbolToScVal,
  addressToScVal,
  i128ToScVal,
} from './stellar.js';
import type { ContractMetric, MetricSummary, ApiResponse } from '../types/index.js';
import { logger } from '../config/logger.js';

export async function getMetric(index: number): Promise<ApiResponse<ContractMetric>> {
  try {
    const simulated = await invokeContract(
      config.contracts.analytics,
      'get_metric',
      [require('stellar-sdk').nativeToScVal(index, { type: 'u64' })]
    );

    if ('result' in simulated) {
      const result = scValToNative<{
        contract_id: string;
        metric_name: string;
        value: string;
        timestamp: string;
        block_height: string;
      }>(simulated.result.retval);

      return {
        success: true,
        data: {
          contractId: result.contract_id,
          metricName: result.metric_name,
          value: result.value,
          timestamp: parseInt(result.timestamp),
          blockHeight: parseInt(result.block_height),
        },
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to get metric', { index, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function getMetricCount(): Promise<ApiResponse<number>> {
  try {
    const simulated = await invokeContract(
      config.contracts.analytics,
      'get_metric_count',
      []
    );

    if ('result' in simulated) {
      const count = scValToNative<number>(simulated.result.retval);
      return {
        success: true,
        data: count,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to get metric count', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function getMetricSummary(
  metricName: string
): Promise<ApiResponse<MetricSummary>> {
  try {
    const simulated = await invokeContract(
      config.contracts.analytics,
      'get_metric_summary',
      [symbolToScVal(metricName)]
    );

    if ('result' in simulated) {
      const result = scValToNative<{
        metric_name: string;
        total_value: string;
        count: string;
        min_value: string;
        max_value: string;
        avg_value: string;
      }>(simulated.result.retval);

      return {
        success: true,
        data: {
          metricName: result.metric_name,
          totalValue: result.total_value,
          count: parseInt(result.count),
          minValue: result.min_value,
          maxValue: result.max_value,
          avgValue: result.avg_value,
        },
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to get metric summary', { metricName, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function listTrackedContracts(): Promise<ApiResponse<string[]>> {
  try {
    const simulated = await invokeContract(
      config.contracts.analytics,
      'list_tracked',
      []
    );

    if ('result' in simulated) {
      const contracts = scValToNative<string[]>(simulated.result.retval);
      return {
        success: true,
        data: contracts,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      error: 'Simulation failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to list tracked contracts', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
