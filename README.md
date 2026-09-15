# Web3 Suite Tooling — Backend API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg)](https://expressjs.com)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-6B3FA0.svg)](https://stellar.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

> Backend REST API service bridging off-chain clients with on-chain Soroban smart contracts for oracle price feeds, analytics metrics, and governance proposals.

---

## Table of Contents

- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Docker](#docker)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Client Apps                                │
│                (Frontend / Third-party)                          │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTP / REST
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Express.js API Server                         │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   Routes   │  │ Middleware │  │   Config   │               │
│  │            │  │            │  │            │               │
│  │ /oracle    │  │ • Helmet   │  │ • Stellar  │               │
│  │ /analytics │  │ • CORS     │  │ • Contracts│               │
│  │ /governance│  │ • Morgan   │  │ • Server   │               │
│  │            │  │ • Errors   │  │ • Zod      │               │
│  └──────┬─────┘  └────────────┘  └────────────┘               │
│         │                                                       │
│  ┌──────┴──────────────────────────────────────────────┐       │
│  │               Service Layer                          │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │       │
│  │  │  Oracle  │  │Analytics │  │Governance│         │       │
│  │  │ Service  │  │ Service  │  │ Service  │         │       │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │       │
│  │       │              │              │               │       │
│  │  ┌────┴──────────────┴──────────────┴────┐         │       │
│  │  │        Stellar Service Layer          │         │       │
│  │  │  (RPC Client, Contract Invocation)    │         │       │
│  │  └───────────────────┬───────────────────┘         │       │
│  └──────────────────────┼─────────────────────────────┘       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ Stellar RPC
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│              Stellar / Soroban Network                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Oracle   │  │ Analytics  │  │ Governance │                │
│  │  Contract  │  │  Contract  │  │  Contract  │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Root

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/` | API info and service listing |
| `GET` | `/api/health` | Server health check with uptime |

### Oracle Service (`/api/oracle`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/oracle/feeds` | — | List all registered price feeds |
| `GET` | `/api/oracle/price/:feedId` | — | Get latest price for a feed |
| `POST` | `/api/oracle/price` | `{ feedId, price, roundId }` | Submit a price update |
| `POST` | `/api/oracle/feeds` | `{ feedId }` | Register a new price feed |
| `GET` | `/api/oracle/health` | — | Oracle service health check |

**POST `/api/oracle/price` Request:**

```json
{
  "feedId": "XLM_USD",
  "price": "12500000000",
  "roundId": 42
}
```

**Response:**

```json
{
  "success": true,
  "data": null,
  "error": null,
  "timestamp": 1700000000000
}
```

### Analytics Service (`/api/analytics`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/metrics/count` | — | Get total recorded metrics |
| `GET` | `/api/analytics/metrics/:index` | — | Get metric by index |
| `GET` | `/api/analytics/summary/:metricName` | — | Get aggregated metric summary |
| `GET` | `/api/analytics/tracked` | — | List all tracked contracts |
| `POST` | `/api/analytics/tracked` | `{ contractId }` | Register a contract for tracking |
| `POST` | `/api/analytics/metrics` | `{ contractId, metricName, value }` | Record a metric data point |
| `GET` | `/api/analytics/snapshot` | — | Take analytics snapshot |
| `GET` | `/api/analytics/health` | — | Analytics service health check |

### Governance Service (`/api/governance`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/governance/proposals` | — | List proposals (paginated: `?page=1&limit=10`) |
| `GET` | `/api/governance/proposals/count` | — | Get total proposal count |
| `GET` | `/api/governance/proposals/:id` | — | Get proposal by ID |
| `POST` | `/api/governance/proposals` | `{ proposer, title, description, targetContract, callData? }` | Create a new proposal |
| `POST` | `/api/governance/proposals/:id/vote` | `{ voter, voteType }` | Cast a vote |
| `POST` | `/api/governance/proposals/:id/execute` | — | Execute a passed proposal |
| `POST` | `/api/governance/proposals/:id/cancel` | — | Cancel a proposal |
| `GET` | `/api/governance/health` | — | Governance service health check |

### Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": 1700000000000
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": "feedId, price, and roundId are required",
  "timestamp": 1700000000000
}
```

---

## Project Structure

```
backend/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose config
├── .env.example              # Environment template
├── .gitignore
├── LICENSE
├── README.md
└── src/
    ├── index.ts              # Express server entry point
    ├── config.ts             # Re-export for import compatibility
    ├── config/
    │   ├── index.ts          # Environment configuration (Zod-validated)
    │   └── logger.ts         # Winston logger setup
    ├── middleware/
    │   └── errorHandler.ts   # Global error handling + AppError class
    ├── routes/
    │   ├── index.ts          # Route aggregation + health endpoints
    │   ├── oracle.ts         # Oracle API endpoints (5 routes)
    │   ├── analytics.ts      # Analytics API endpoints (7 routes)
    │   └── governance.ts     # Governance API endpoints (8 routes)
    ├── services/
    │   ├── stellar.ts        # Stellar RPC client + ScVal converters
    │   ├── oracle.ts         # Oracle contract interaction
    │   ├── analytics.ts      # Analytics contract interaction
    │   └── governance.ts     # Governance contract interaction
    └── types/
        └── index.ts          # Zod schemas + TypeScript types
```

---

## Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Running Soroban smart contracts (see [contracts](../contracts/))

### Installation

```bash
# Clone the repository
git clone https://github.com/sudo-robi/web3-suite-tooling-backend.git
cd web3-suite-tooling-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration (see Environment Variables below)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode (`development` \| `production`) |
| `LOG_LEVEL` | No | `info` | Logging level (`debug` \| `info` \| `warn` \| `error`) |
| `STELLAR_NETWORK` | No | `testnet` | Stellar network (`standalone` \| `testnet` \| `mainnet`) |
| `STELLAR_RPC_URL` | No | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | No | `https://horizon-testnet.stellar.org` | Horizon API endpoint |
| `STELLAR_PASSPHRASE` | No | `Test SDF Network ; September 2015` | Network passphrase |
| `ORACLE_CONTRACT_ID` | **Yes** | — | Deployed Oracle contract address |
| `ANALYTICS_CONTRACT_ID` | **Yes** | — | Deployed Analytics contract address |
| `GOVERNANCE_CONTRACT_ID` | **Yes** | — | Deployed Governance contract address |
| `ADMIN_SECRET_KEY` | **Yes** | — | Admin secret key for contract calls |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per rate limit window |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

---

## Development

```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Docker

### Build & Run

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Or with docker-compose
docker compose up -d

# View logs
docker compose logs -f api

# Stop
docker compose down
```

### Dockerfile

Multi-stage build for minimal production image:

| Stage | Purpose |
|-------|---------|
| `deps` | Install production dependencies only |
| `build` | Compile TypeScript to JavaScript |
| `production` | Final minimal image with tini init |

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Structure

Tests are organized by service:

- `services/oracle.test.ts` — Oracle contract interaction tests
- `services/analytics.test.ts` — Analytics contract interaction tests
- `services/governance.test.ts` — Governance contract interaction tests

---

## Error Handling

| Status | Description |
|--------|-------------|
| `200` | Success |
| `400` | Bad request (invalid parameters, validation error) |
| `404` | Resource not found |
| `500` | Internal server error |

The `AppError` class is used for operational errors with appropriate status codes. Unhandled errors are caught by the global error handler and return a generic 500 response.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express 4** | HTTP server framework |
| **TypeScript 5** | Type safety |
| **Stellar SDK** | Soroban contract interaction |
| **Zod** | Request validation schemas |
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **Morgan** | HTTP request logging |
| **Winston** | Structured logging |
| **Vitest** | Unit testing |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m 'feat: add my feature'`)
4. Push to branch (`git push origin feat/my-feature`)
5. Open a Pull Request

### Development Workflow

```bash
# Before committing, run all checks:
npm run typecheck
npm run lint:fix
npm test
```

### Commit Convention

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `refactor:` | Code restructuring without behavior change |
| `chore:` | Maintenance tasks |

---

## License

[MIT](LICENSE)

Copyright (c) 2024 Web3 Suite contributors
