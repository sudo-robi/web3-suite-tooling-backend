import { Router, Request, Response } from 'express';
import { getMetric, getMetricCount, getMetricSummary, listTrackedContracts } from '../services/analytics.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/metrics/count', async (_req: Request, res: Response) => {
  const result = await getMetricCount();
  res.json(result);
});

router.get('/metrics/:index', async (req: Request, res: Response) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0) {
    throw new AppError(400, 'Valid metric index is required');
  }

  const result = await getMetric(index);
  res.json(result);
});

router.get('/summary/:metricName', async (req: Request, res: Response) => {
  const { metricName } = req.params;
  if (!metricName) {
    throw new AppError(400, 'metricName is required');
  }

  const result = await getMetricSummary(metricName);
  res.json(result);
});

router.get('/tracked', async (_req: Request, res: Response) => {
  const result = await listTrackedContracts();
  res.json(result);
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { service: 'analytics', status: 'healthy' },
    timestamp: Date.now(),
  });
});

export default router;
