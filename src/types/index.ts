import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────

export const PriceFeedSchema = z.object({
  feedId: z.string().min(1),
  price: z.string(),
  decimals: z.number().int().nonnegative(),
  timestamp: z.number().int().nonnegative(),
  roundId: z.number().int().nonnegative(),
});

export const ContractMetricSchema = z.object({
  contractId: z.string().min(1),
  metricName: z.string().min(1),
  value: z.string(),
  timestamp: z.number().int().nonnegative(),
  blockHeight: z.number().int().nonnegative(),
});

export const MetricSummarySchema = z.object({
  metricName: z.string(),
  totalValue: z.string(),
  count: z.number().int().nonnegative(),
  minValue: z.string(),
  maxValue: z.string(),
  avgValue: z.string(),
});

export const ProposalSchema = z.object({
  id: z.number().int().nonnegative(),
  proposer: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  targetContract: z.string().min(1),
  callData: z.string(),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative(),
  executed: z.boolean(),
  canceled: z.boolean(),
});

export const VoteSchema = z.object({
  voter: z.string().min(1),
  proposalId: z.number().int().nonnegative(),
  voteType: z.enum(['for', 'against', 'abstain']),
  weight: z.string(),
  timestamp: z.number().int().nonnegative(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.number().int().nonnegative(),
  });

export const SubmitPriceSchema = z.object({
  feedId: z.string().min(1, 'feedId is required'),
  price: z.string().or(z.number()).transform(String),
  roundId: z.number().int().nonnegative('roundId must be non-negative'),
});

export const CreateProposalSchema = z.object({
  proposer: z.string().min(1, 'proposer is required'),
  title: z.string().min(1, 'title is required').max(64, 'title too long'),
  description: z.string().min(1, 'description is required').max(256, 'description too long'),
  targetContract: z.string().min(1, 'targetContract is required'),
  callData: z.string().default(''),
});

export const VoteOnProposalSchema = z.object({
  voter: z.string().min(1, 'voter is required'),
  proposalId: z.number().int().nonnegative(),
  voteType: z.enum(['for', 'against', 'abstain'], {
    errorMap: () => ({ message: 'voteType must be "for", "against", or "abstain"' }),
  }),
});

export const RecordMetricSchema = z.object({
  contractId: z.string().min(1, 'contractId is required'),
  metricName: z.string().min(1, 'metricName is required'),
  value: z.string().or(z.number()).transform(String),
});

// ─── TypeScript Types ──────────────────────────────────────

export type PriceFeed = z.infer<typeof PriceFeedSchema>;
export type ContractMetric = z.infer<typeof ContractMetricSchema>;
export type MetricSummary = z.infer<typeof MetricSummarySchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type Vote = z.infer<typeof VoteSchema>;

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
