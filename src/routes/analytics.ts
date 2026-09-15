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

router.post('/tracked', async (req: Request, res: Response) => {
  const { contractId } = req.body;

  if (!contractId || typeof contractId !== 'string') {
    throw new AppError(400, 'contractId is required and must be a string');
  }

  // In production, this would invoke the analytics contract's track_contract method
  res.json({
    success: true,
    data: {
      message: 'Contract tracking requires admin-signed transaction',
      contractId,
    },
    timestamp: Date.now(),
  });
});

router.post('/metrics', async (req: Request, res: Response) => {
  const { contractId, metricName, value } = req.body;

  if (!contractId || !metricName || value === undefined) {
    throw new AppError(400, 'contractId, metricName, and value are required');
  }

  // In production, this would invoke the analytics contract's record_metric method
  res.json({
    success: true,
    data: {
      message: 'Metric recording requires signed transaction',
      contractId,
      metricName,
      value,
    },
    timestamp: Date.now(),
  });
});

router.get('/snapshot', async (_req: Request, res: Response) => {
  // In production, this would invoke the analytics contract's take_snapshot method
  res.json({
    success: true,
    data: {
      message: 'Snapshot requires contract invocation',
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { service: 'analytics', status: 'healthy' },
    timestamp: Date.now(),
  });
});

export default router;
