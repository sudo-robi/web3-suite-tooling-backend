import { config } from '../config/index.js';
import {
  invokeContract,
  scValToNative,
  symbolToScVal,
  addressToScVal,
  u64ToScVal,
} from './stellar.js';
import type { Proposal, Vote, ApiResponse } from '../types/index.js';
import { logger } from '../config/logger.js';

export async function getProposal(proposalId: number): Promise<ApiResponse<Proposal>> {
  try {
    const simulated = await invokeContract(
      config.contracts.governance,
      'get_proposal',
      [u64ToScVal(proposalId)]
    );

    if ('result' in simulated) {
      const result = scValToNative<{
        id: string;
        proposer: string;
        title: string;
        description: string;
        target_contract: string;
        call_data: string;
        for_votes: string;
        against_votes: string;
        abstain_votes: string;
        start_time: string;
        end_time: string;
        executed: boolean;
        canceled: boolean;
      }>(simulated.result.retval);

      return {
        success: true,
        data: {
          id: parseInt(result.id),
          proposer: result.proposer,
          title: result.title,
          description: result.description,
          targetContract: result.target_contract,
          callData: result.call_data,
          forVotes: result.for_votes,
          againstVotes: result.against_votes,
          abstainVotes: result.abstain_votes,
          startTime: parseInt(result.start_time),
          endTime: parseInt(result.end_time),
          executed: result.executed,
          canceled: result.canceled,
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
    logger.error('Failed to get proposal', { proposalId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function getProposalCount(): Promise<ApiResponse<number>> {
  try {
    const simulated = await invokeContract(
      config.contracts.governance,
      'get_proposal_count',
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
    logger.error('Failed to get proposal count', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

export async function listProposals(
  offset: number = 0,
  limit: number = 10
): Promise<ApiResponse<Proposal[]>> {
  try {
    const countResp = await getProposalCount();
    if (!countResp.success || !countResp.data) {
      return { success: false, error: 'Failed to get proposal count', timestamp: Date.now() };
    }

    const total = countResp.data;
    const end = Math.min(offset + limit, total);
    const proposals: Proposal[] = [];

    for (let i = offset; i < end; i++) {
      const proposal = await getProposal(i);
      if (proposal.success && proposal.data) {
        proposals.push(proposal.data);
      }
    }

    return {
      success: true,
      data: proposals,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to list proposals', { offset, limit, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
