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

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { service: 'governance', status: 'healthy' },
    timestamp: Date.now(),
  });
});

export default router;
