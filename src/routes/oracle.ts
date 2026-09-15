import { Router, Request, Response } from 'express';
import { getOraclePrice, listOracleFeeds, submitOraclePrice } from '../services/oracle.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/feeds', async (_req: Request, res: Response) => {
  const result = await listOracleFeeds();
  res.json(result);
});

router.get('/price/:feedId', async (req: Request, res: Response) => {
  const { feedId } = req.params;

  if (!feedId || typeof feedId !== 'string') {
    throw new AppError(400, 'Valid feedId is required');
  }

  const result = await getOraclePrice(feedId);
  res.json(result);
});

router.post('/price', async (req: Request, res: Response) => {
  const { feedId, price, roundId } = req.body;

  if (!feedId || !price || roundId === undefined) {
    throw new AppError(400, 'feedId, price, and roundId are required');
  }

  const result = await submitOraclePrice(feedId, String(price), roundId);
  res.json(result);
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { service: 'oracle', status: 'healthy' },
    timestamp: Date.now(),
  });
});

export default router;
