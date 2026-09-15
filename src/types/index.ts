export interface PriceFeed {
  feedId: string;
  price: string;
  decimals: number;
  timestamp: number;
  roundId: number;
}

export interface ContractMetric {
  contractId: string;
  metricName: string;
  value: string;
  timestamp: number;
  blockHeight: number;
}

export interface MetricSummary {
  metricName: string;
  totalValue: string;
  count: number;
  minValue: string;
  maxValue: string;
  avgValue: string;
}

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  targetContract: string;
  callData: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startTime: number;
  endTime: number;
  executed: boolean;
  canceled: boolean;
}

export interface Vote {
  voter: string;
  proposalId: number;
  voteType: 'for' | 'against' | 'abstain';
  weight: string;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
