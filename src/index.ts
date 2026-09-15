import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// Routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    timestamp: Date.now(),
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Web3 Suite Tooling API running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Stellar network: ${config.stellar.network}`);
});

export default app;
