import { Router, Request, Response } from 'express';
import oracleRoutes from './oracle.js';
import analyticsRoutes from './analytics.js';
import governanceRoutes from './governance.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Web3 Suite Tooling API',
      version: '0.1.0',
      services: {
        oracle: '/api/oracle',
        analytics: '/api/analytics',
        governance: '/api/governance',
      },
    },
    timestamp: Date.now(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy', uptime: process.uptime() },
    timestamp: Date.now(),
  });
});

router.use('/oracle', oracleRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/governance', governanceRoutes);

export default router;
