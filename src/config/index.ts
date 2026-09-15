import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    passphrase: process.env.STELLAR_PASSPHRASE || 'Test SDF Network ; September 2015',
  },

  contracts: {
    oracle: process.env.ORACLE_CONTRACT_ID || '',
    analytics: process.env.ANALYTICS_CONTRACT_ID || '',
    governance: process.env.GOVERNANCE_CONTRACT_ID || '',
  },

  adminSecretKey: process.env.ADMIN_SECRET_KEY || '',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
} as const;
