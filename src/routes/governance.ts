import { Router, Request, Response } from 'express';
import { getProposal, getProposalCount, listProposals } from '../services/governance.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/proposals', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const result = await listProposals(offset, limit);
  res.json(result);
});

router.get('/proposals/count', async (_req: Request, res: Response) => {
  const result = await getProposalCount();
  res.json(result);
});

router.get('/proposals/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 0) {
    throw new AppError(400, 'Valid proposal ID is required');
  }

  const result = await getProposal(id);
  res.json(result);
});

router.post('/proposals', async (req: Request, res: Response) => {
  const { proposer, title, description, targetContract, callData } = req.body;

  if (!proposer || !title || !description || !targetContract) {
    throw new AppError(400, 'proposer, title, description, and targetContract are required');
  }

  // In production, this would invoke the governance contract's create_proposal method
  // For now, return a placeholder response
  res.json({
    success: true,
    data: {
      message: 'Proposal creation requires wallet-signed transaction',
      proposer,
      title,
      description,
      targetContract,
      callData: callData || '',
    },
    timestamp: Date.now(),
  });
});

router.post('/proposals/:id/vote', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { voter, voteType } = req.body;

  if (isNaN(id) || id < 0) {
    throw new AppError(400, 'Valid proposal ID is required');
  }
  if (!voter || !voteType) {
    throw new AppError(400, 'voter and voteType are required');
  }
  if (!['for', 'against', 'abstain'].includes(voteType)) {
    throw new AppError(400, 'voteType must be "for", "against", or "abstain"');
  }

  // In production, this would invoke the governance contract's vote method
  res.json({
    success: true,
    data: {
      message: 'Vote submission requires wallet-signed transaction',
      proposalId: id,
      voter,
      voteType,
    },
    timestamp: Date.now(),
  });
});

router.post('/proposals/:id/execute', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id < 0) {
    throw new AppError(400, 'Valid proposal ID is required');
  }

  // In production, this would invoke the governance contract's execute_proposal method
  res.json({
    success: true,
    data: {
      message: 'Proposal execution requires admin-signed transaction',
      proposalId: id,
    },
    timestamp: Date.now(),
  });
});

router.post('/proposals/:id/cancel', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id < 0) {
    throw new AppError(400, 'Valid proposal ID is required');
  }

  // In production, this would invoke the governance contract's cancel_proposal method
  res.json({
    success: true,
    data: {
      message: 'Proposal cancellation requires proposer/admin-signed transaction',
      proposalId: id,
    },
    timestamp: Date.now(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { service: 'governance', status: 'healthy' },
    timestamp: Date.now(),
  });
});

export default router;
