# Web3 Suite Tooling Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg)](https://expressjs.com)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-6B3FA0.svg)](https://stellar.org)

Backend REST API service for the **Web3 Suite Tooling** platform. Provides HTTP endpoints that bridge off-chain clients with on-chain Soroban smart contracts for oracle price feeds, analytics metrics, and governance proposals.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client Apps                          │
│              (Frontend / Third-party)                    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP / REST
                      ▼
┌──────────────────────────────────────────────────────────┐
│                  Express.js API                          │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Routes    │  │ Middleware │  │  Config    │        │
│  │            │  │            │  │            │        │
│  │ /oracle    │  │ - Helmet   │  │ - Stellar  │        │
│  │ /analytics │  │ - CORS     │  │ - Contracts│        │
│  │ /governance│  │ - Logging  │  │ - Server   │        │
│  └──────┬─────┘  └────────────┘  └────────────┘        │
│         │                                                │
│  ┌──────┴──────────────────────────────────────────┐    │
│  │              Service Layer                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │ Oracle   │ │Analytics │ │Governance│       │    │
│  │  │ Service  │ │ Service  │ │ Service  │       │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘       │    │
│  │       │             │             │              │    │
│  │  ┌────┴─────────────┴─────────────┴────┐       │    │
│  │  │       Stellar Service Layer         │       │    │
│  │  │  (RPC Client, Contract Invocation)  │       │    │
│  │  └─────────────────────┬───────────────┘       │    │
│  └────────────────────────┼───────────────────────┘    │
└───────────────────────────┼──────────────────────────────┘
                            │ Stellar RPC
                            ▼
┌──────────────────────────────────────────────────────────┐
│            Stellar / Soroban Network                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │  Oracle    │ │ Analytics  │ │ Governance │          │
│  │  Contract  │ │  Contract  │ │  Contract  │          │
│  └────────────┘ └────────────┘ └────────────┘          │
└──────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Root

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/` | API info and service listing |
| `GET` | `/api/health` | Server health check |

### Oracle Service (`/api/oracle`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/oracle/feeds` | List all registered price feeds |
| `GET` | `/api/oracle/price/:feedId` | Get latest price for a feed |
| `POST` | `/api/oracle/price` | Submit a price update |
| `GET` | `/api/oracle/health` | Oracle service health check |

**POST `/api/oracle/price` Request Body:**

```json
{
  "feedId": "XLM_USD",
  "price": "12500000000",
  "roundId": 42
}
```

### Analytics Service (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/metrics/count` | Get total recorded metrics |
| `GET` | `/api/analytics/metrics/:index` | Get metric by index |
| `GET` | `/api/analytics/summary/:metricName` | Get aggregated metric summary |
| `GET` | `/api/analytics/tracked` | List all tracked contracts |
| `GET` | `/api/analytics/health` | Analytics service health check |

### Governance Service (`/api/governance`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/governance/proposals` | List proposals (paginated) |
| `GET` | `/api/governance/proposals/count` | Get total proposal count |
| `GET` | `/api/governance/proposals/:id` | Get proposal by ID |
| `GET` | `/api/governance/health` | Governance service health check |

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

---

## Project Structure

```
web3-suite-tooling-backend/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── src/
    ├── index.ts              # Express server entry point
    ├── config/
    │   ├── index.ts          # Environment configuration
    │   └── logger.ts         # Winston logger setup
    ├── middleware/
    │   └── errorHandler.ts   # Global error handling
    ├── routes/
    │   ├── index.ts          # Route aggregation
    │   ├── oracle.ts         # Oracle API endpoints
    │   ├── analytics.ts      # Analytics API endpoints
    │   └── governance.ts     # Governance API endpoints
    ├── services/
    │   ├── stellar.ts        # Stellar RPC client utilities
    │   ├── oracle.ts         # Oracle contract interaction
    │   ├── analytics.ts      # Analytics contract interaction
    │   └── governance.ts     # Governance contract interaction
    └── types/
        └── index.ts          # TypeScript type definitions
```

---

## Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Running Soroban smart contracts (see [contracts repo](../web3-suite-tooling-contracts))

### Installation

```bash
# Clone the repository
git clone https://github.com/sudo-robi/web3-suite-tooling-backend.git
cd web3-suite-tooling-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `LOG_LEVEL` | No | `info` | Logging level |
| `STELLAR_NETWORK` | No | `testnet` | Stellar network |
| `STELLAR_RPC_URL` | No | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | No | `https://horizon-testnet.stellar.org` | Horizon API endpoint |
| `STELLAR_PASSPHRASE` | No | `Test SDF Network ; September 2015` | Network passphrase |
| `ORACLE_CONTRACT_ID` | **Yes** | - | Deployed Oracle contract address |
| `ANALYTICS_CONTRACT_ID` | **Yes** | - | Deployed Analytics contract address |
| `GOVERNANCE_CONTRACT_ID` | **Yes** | - | Deployed Governance contract address |
| `ADMIN_SECRET_KEY` | **Yes** | - | Admin secret key for contract calls |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

### Development

```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests
npm test
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Or with docker-compose
docker compose up -d
```

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Error Handling

All errors are returned in the standard API response format with appropriate HTTP status codes:

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m 'feat: add my feature'`)
4. Push to branch (`git push origin feat/my-feature`)
5. Open a Pull Request

### Development Workflow

- Run `npm run typecheck` before committing
- Run `npm run lint:fix` to auto-fix linting issues
- Write tests for new features
- Follow [Conventional Commits](https://www.conventionalcommits.org/)

---

## License

[MIT](LICENSE)
