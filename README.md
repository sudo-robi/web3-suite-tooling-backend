# Web3 Suite Tooling — Backend API

> REST API service bridging off-chain clients with on-chain Soroban smart contracts for oracle price feeds, analytics metrics, and governance proposals on the Stellar network.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg)](https://expressjs.com)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-6B3FA0.svg)](https://stellar.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)
[![Issues](https://img.shields.io/github/issues/sudo-robi/web3-suite-tooling-backend)](https://github.com/sudo-robi/web3-suite-tooling-backend/issues)
[![Stars](https://img.shields.io/github/stars/sudo-robi/web3-suite-tooling-backend)](https://github.com/sudo-robi/web3-suite-tooling-backend/stargazers)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running](#running)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

### Problem

Soroban smart contracts run on-chain and cannot serve HTTP requests. Frontend dashboards and third-party integrations need a standard REST API to query on-chain state, submit transactions, and aggregate data without directly constructing Stellar transactions. Without a backend layer, every client must handle RPC connection, transaction building, signing, and response parsing.

### Solution

This backend API provides a RESTful HTTP interface to three Soroban smart contracts:

| Service | Endpoints | Purpose |
|---------|-----------|---------|
| **Oracle** | 5 | Price feed queries and submissions |
| **Analytics** | 7 | Metric tracking and summaries |
| **Governance** | 8 | Proposal management and voting |

The API handles Stellar RPC communication, transaction simulation, ScVal serialization, and response normalization — clients only need standard HTTP.

### Audience

- **Frontend developers** building dashboards for Stellar/Soroban dApps
- **API consumers** integrating Stellar data into existing systems
- **Mobile app developers** needing a lightweight HTTP interface
- **DevOps teams** deploying containerized API infrastructure

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Client Applications                             │
│                   (Frontend / Third-party / Mobile)                      │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTP / REST (JSON)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       Express.js API Server                              │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Routes     │  │  Middleware  │  │   Config     │                  │
│  │              │  │              │  │              │                  │
│  │ /api/oracle  │  │ • Helmet     │  │ • Stellar    │                  │
│  │ /api/analytics│ │ • CORS       │  │ • Contracts  │                  │
│  │ /api/governance││ • Morgan    │  │ • Server     │                  │
│  │              │  │ • Errors     │  │ • Zod        │                  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘                  │
│         │                                                               │
│  ┌──────┴──────────────────────────────────────────────────────────┐    │
│  │                     Service Layer                                │    │
│  │                                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │    │
│  │  │  Oracle  │  │Analytics │  │Governance│                     │    │
│  │  │ Service  │  │ Service  │  │ Service  │                     │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │    │
│  │       │              │              │                           │    │
│  │  ┌────┴──────────────┴──────────────┴──────────────────┐      │    │
│  │  │              Stellar Service Layer                    │      │    │
│  │  │  • RPC Client (simulateTransaction)                  │      │    │
│  │  │  • ScVal Converters (symbol, i128, u64, address)    │      │    │
│  │  │  • Transaction Builder                               │      │    │
│  │  └───────────────────────┬──────────────────────────────┘      │    │
│  └──────────────────────────┼──────────────────────────────────────┘    │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │ Stellar RPC
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Stellar / Soroban Network                               │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Oracle     │  │  Analytics   │  │  Governance  │                  │
│  │  Contract    │  │  Contract    │  │  Contract    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client  │────►│  Express │────►│  Service │────►│  Stellar │────►│  Soroban │
│ (HTTP)  │◄────│  Router  │◄────│  Layer   │◄────│  RPC     │◄────│  Network │
└─────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                     │
                              ┌──────┴──────┐
                              │  Zod Schema │
                              │  Validation │
                              └─────────────┘
```

### Request Processing Pipeline

```
1. Client sends HTTP request
         │
2. Helmet adds security headers
         │
3. CORS validates origin
         │
4. Morgan logs request
         │
5. Express router matches route
         │
6. Route handler validates input (Zod/manual)
         │
7. Service layer invokes contract via Stellar RPC
         │
8. ScVal response converted to native JS types
         │
9. Response wrapped in ApiResponse format
         │
10. JSON response sent to client
```

---

## Features

| Feature | Description |
|---------|-------------|
| **RESTful API** | Standard HTTP endpoints with JSON request/response |
| **Stellar RPC Integration** | Direct Soroban contract invocation via `simulateTransaction` |
| **ScVal Serialization** | Automatic conversion between JS types and Stellar ScVal |
| **Zod Validation** | Request body and parameter validation with TypeScript inference |
| **Security Headers** | Helmet.js adds CSP, HSTS, X-Frame-Options, etc. |
| **CORS Configuration** | Configurable cross-origin resource sharing |
| **Structured Logging** | Winston logger with JSON format and configurable levels |
| **Request Logging** | Morgan HTTP request logging piped through Winston |
| **Error Handling** | Global error handler with `AppError` operational error class |
| **Docker Ready** | Multi-stage Dockerfile with tini init and non-root user |
| **Health Checks** | `/api/health` and per-service health endpoints |
| **Consistent Response Format** | All endpoints return `{ success, data, error, timestamp }` |
| **TypeScript Strict** | Full strict mode with declaration maps |
| **Hot Reload** | `tsx watch` for development with instant restart |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **TypeScript** | 5.x | Type safety and developer experience |
| **Express** | 4.x | HTTP server framework |
| **@stellar/stellar-sdk** | 11.1.0 | Soroban contract interaction |
| **Zod** | 3.22 | Runtime validation and type inference |
| **Helmet** | 7.x | HTTP security headers |
| **CORS** | 2.8.x | Cross-origin resource sharing |
| **Morgan** | 1.10.x | HTTP request logging |
| **Winston** | 3.11 | Structured application logging |
| **dotenv** | 16.4 | Environment variable loading |
| **Vitest** | 1.2 | Unit testing framework |
| **tsx** | 4.7 | TypeScript execution for dev |

---

## Project Structure

```
backend/
├── package.json                 # Dependencies, scripts, engine requirements
├── tsconfig.json                # TypeScript config (strict, NodeNext, paths)
├── Dockerfile                   # Multi-stage Docker build (deps → build → production)
├── docker-compose.yml           # Docker Compose with health checks
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT License
├── README.md                    # This file
│
└── src/
    ├── index.ts                 # Express server entry point (42 lines)
    ├── config.ts                # Re-export for import compatibility
    │
    ├── config/
    │   ├── index.ts             # Environment config with Zod validation (32 lines)
    │   └── logger.ts            # Winston logger setup (23 lines)
    │
    ├── middleware/
    │   └── errorHandler.ts      # Global error handler + AppError class (36 lines)
    │
    ├── routes/
    │   ├── index.ts             # Route aggregation + health endpoints (36 lines)
    │   ├── oracle.ts            # Oracle API endpoints — 5 routes (69 lines)
    │   ├── analytics.ts         # Analytics API endpoints — 7 routes (95 lines)
    │   └── governance.ts        # Governance API endpoints — 8 routes (125 lines)
    │
    ├── services/
    │   ├── stellar.ts           # Stellar RPC client + ScVal converters (62 lines)
    │   ├── oracle.ts            # Oracle contract interaction (110 lines)
    │   ├── analytics.ts         # Analytics contract interaction (169 lines)
    │   └── governance.ts        # Governance contract interaction (139 lines)
    │
    └── types/
        └── index.ts             # Zod schemas + TypeScript types (115 lines)
```

### File Descriptions

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 42 | Server bootstrap: middleware, routes, error handlers, listen |
| `src/config/index.ts` | 32 | Typed config from environment variables |
| `src/config/logger.ts` | 23 | Winston logger with JSON and console transports |
| `src/middleware/errorHandler.ts` | 36 | `AppError` class and global Express error handler |
| `src/routes/index.ts` | 36 | Route aggregation, `/api/` info, `/api/health` |
| `src/routes/oracle.ts` | 69 | 5 Oracle endpoints with input validation |
| `src/routes/analytics.ts` | 95 | 7 Analytics endpoints with type parsing |
| `src/routes/governance.ts` | 125 | 8 Governance endpoints with pagination |
| `src/services/stellar.ts` | 62 | Stellar RPC client, ScVal converters, contract invocation |
| `src/services/oracle.ts` | 110 | Oracle contract read/write operations |
| `src/services/analytics.ts` | 169 | Analytics contract read/write operations |
| `src/services/governance.ts` | 139 | Governance contract read/write with pagination |
| `src/types/index.ts` | 115 | Zod schemas, TypeScript interfaces, API response types |

---

## API Reference

### Root Endpoints

#### GET `/api/`

API information and service listing.

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "Web3 Suite Tooling API",
    "version": "0.1.0",
    "services": {
      "oracle": "/api/oracle",
      "analytics": "/api/analytics",
      "governance": "/api/governance"
    }
  },
  "timestamp": 1700000000000
}
```

#### GET `/api/health`

Server health check with uptime.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600.5
  },
  "timestamp": 1700000000000
}
```

---

### Oracle Service (`/api/oracle`)

#### GET `/api/oracle/feeds`

List all registered price feeds.

**cURL:**

```bash
curl http://localhost:3001/api/oracle/feeds
```

**Response:**

```json
{
  "success": true,
  "data": ["XLM_USD", "AQUA_USD"],
  "timestamp": 1700000000000
}
```

---

#### GET `/api/oracle/price/:feedId`

Get latest price for a specific feed.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `feedId` | `string` | Feed identifier (e.g., `XLM_USD`) |

**cURL:**

```bash
curl http://localhost:3001/api/oracle/price/XLM_USD
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "feedId": "XLM_USD",
    "price": "12500000000",
    "decimals": 8,
    "timestamp": 1700000000,
    "roundId": 42
  },
  "timestamp": 1700000000000
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Valid feedId is required",
  "timestamp": 1700000000000
}
```

---

#### POST `/api/oracle/price`

Submit a price update for a feed.

**Request Body:**

```json
{
  "feedId": "XLM_USD",
  "price": "12500000000",
  "roundId": 42
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feedId` | `string` | Yes | Feed identifier |
| `price` | `string \| number` | Yes | Price with 8 decimals |
| `roundId` | `number` | Yes | Non-negative round number |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/oracle/price \
  -H "Content-Type: application/json" \
  -d '{"feedId": "XLM_USD", "price": "12500000000", "roundId": 42}'
```

**Response (200):**

```json
{
  "success": true,
  "data": null,
  "timestamp": 1700000000000
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "feedId, price, and roundId are required",
  "timestamp": 1700000000000
}
```

---

#### POST `/api/oracle/feeds`

Register a new price feed.

**Request Body:**

```json
{
  "feedId": "XLM_USD"
}
```

**cURL:**

```bash
curl -X POST http://localhost:3001/api/oracle/feeds \
  -H "Content-Type: application/json" \
  -d '{"feedId": "XLM_USD"}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Feed registration requires admin-signed transaction",
    "feedId": "XLM_USD"
  },
  "timestamp": 1700000000000
}
```

---

#### GET `/api/oracle/health`

Oracle service health check.

**cURL:**

```bash
curl http://localhost:3001/api/oracle/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "service": "oracle",
    "status": "healthy"
  },
  "timestamp": 1700000000000
}
```

---

### Analytics Service (`/api/analytics`)

#### GET `/api/analytics/metrics/count`

Get total recorded metrics.

**cURL:**

```bash
curl http://localhost:3001/api/analytics/metrics/count
```

**Response:**

```json
{
  "success": true,
  "data": 142,
  "timestamp": 1700000000000
}
```

---

#### GET `/api/analytics/metrics/:index`

Get metric by index.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `index` | `number` | Metric index (0-based) |

**cURL:**

```bash
curl http://localhost:3001/api/analytics/metrics/0
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "contractId": "CAAAA...",
    "metricName": "volume",
    "value": "1000",
    "timestamp": 1700000000,
    "blockHeight": 12345
  },
  "timestamp": 1700000000000
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Valid metric index is required",
  "timestamp": 1700000000000
}
```

---

#### GET `/api/analytics/summary/:metricName`

Get aggregated metric summary.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `metricName` | `string` | Metric name to summarize |

**cURL:**

```bash
curl http://localhost:3001/api/analytics/summary/volume
```

**Response:**

```json
{
  "success": true,
  "data": {
    "metricName": "volume",
    "totalValue": "6000",
    "count": 3,
    "minValue": "1000",
    "maxValue": "3000",
    "avgValue": "2000"
  },
  "timestamp": 1700000000000
}
```

---

#### GET `/api/analytics/tracked`

List all tracked contracts.

**cURL:**

```bash
curl http://localhost:3001/api/analytics/tracked
```

**Response:**

```json
{
  "success": true,
  "data": ["CAAAA...", "CBBBB..."],
  "timestamp": 1700000000000
}
```

---

#### POST `/api/analytics/tracked`

Register a contract for tracking.

**Request Body:**

```json
{
  "contractId": "CAAAA..."
}
```

**cURL:**

```bash
curl -X POST http://localhost:3001/api/analytics/tracked \
  -H "Content-Type: application/json" \
  -d '{"contractId": "CAAAA..."}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Contract tracking requires admin-signed transaction",
    "contractId": "CAAAA..."
  },
  "timestamp": 1700000000000
}
```

---

#### POST `/api/analytics/metrics`

Record a metric data point.

**Request Body:**

```json
{
  "contractId": "CAAAA...",
  "metricName": "volume",
  "value": 1000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractId` | `string` | Yes | Source contract address |
| `metricName` | `string` | Yes | Metric label |
| `value` | `string \| number` | Yes | Numeric value |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/analytics/metrics \
  -H "Content-Type: application/json" \
  -d '{"contractId": "CAAAA...", "metricName": "volume", "value": 1000}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Metric recording requires signed transaction",
    "contractId": "CAAAA...",
    "metricName": "volume",
    "value": 1000
  },
  "timestamp": 1700000000000
}
```

---

#### GET `/api/analytics/snapshot`

Take analytics snapshot.

**cURL:**

```bash
curl http://localhost:3001/api/analytics/snapshot
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Snapshot requires contract invocation",
    "timestamp": 1700000000000
  },
  "timestamp": 1700000000000
}
```

---

#### GET `/api/analytics/health`

Analytics service health check.

**cURL:**

```bash
curl http://localhost:3001/api/analytics/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "service": "analytics",
    "status": "healthy"
  },
  "timestamp": 1700000000000
}
```

---

### Governance Service (`/api/governance`)

#### GET `/api/governance/proposals`

List proposals with pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `10` | Items per page |

**cURL:**

```bash
curl "http://localhost:3001/api/governance/proposals?page=1&limit=10"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 0,
      "proposer": "GABC...",
      "title": "title",
      "description": "desc",
      "targetContract": "GDEF...",
      "callData": "",
      "forVotes": "5",
      "againstVotes": "1",
      "abstainVotes": "0",
      "startTime": 1700000000,
      "endTime": 1700604800,
      "executed": false,
      "canceled": false
    }
  ],
  "timestamp": 1700000000000
}
```

---

#### GET `/api/governance/proposals/count`

Get total proposal count.

**cURL:**

```bash
curl http://localhost:3001/api/governance/proposals/count
```

**Response:**

```json
{
  "success": true,
  "data": 12,
  "timestamp": 1700000000000
}
```

---

#### GET `/api/governance/proposals/:id`

Get proposal by ID.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `number` | Proposal ID (0-based) |

**cURL:**

```bash
curl http://localhost:3001/api/governance/proposals/0
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 0,
    "proposer": "GABC...",
    "title": "Increase Quorum",
    "description": "Proposal to increase governance quorum from 100 to 200",
    "targetContract": "GDEF...",
    "callData": "",
    "forVotes": "150",
    "againstVotes": "30",
    "abstainVotes": "20",
    "startTime": 1700000000,
    "endTime": 1700604800,
    "executed": false,
    "canceled": false
  },
  "timestamp": 1700000000000
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Valid proposal ID is required",
  "timestamp": 1700000000000
}
```

---

#### POST `/api/governance/proposals`

Create a new proposal.

**Request Body:**

```json
{
  "proposer": "GABC...",
  "title": "Increase Quorum",
  "description": "Proposal to increase governance quorum",
  "targetContract": "GDEF...",
  "callData": ""
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `proposer` | `string` | Yes | Proposer Stellar address |
| `title` | `string` | Yes | Proposal title |
| `description` | `string` | Yes | Proposal description |
| `targetContract` | `string` | Yes | Target contract address |
| `callData` | `string` | No | Encoded call data (default: `""`) |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/governance/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "proposer": "GABC...",
    "title": "Increase Quorum",
    "description": "Proposal to increase governance quorum",
    "targetContract": "GDEF..."
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Proposal creation requires wallet-signed transaction",
    "proposer": "GABC...",
    "title": "Increase Quorum",
    "description": "Proposal to increase governance quorum",
    "targetContract": "GDEF...",
    "callData": ""
  },
  "timestamp": 1700000000000
}
```

---

#### POST `/api/governance/proposals/:id/vote`

Cast a vote on a proposal.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `number` | Proposal ID |

**Request Body:**

```json
{
  "voter": "GABC...",
  "voteType": "for"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `voter` | `string` | Yes | Voter Stellar address |
| `voteType` | `string` | Yes | `"for"`, `"against"`, or `"abstain"` |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/governance/proposals/0/vote \
  -H "Content-Type: application/json" \
  -d '{"voter": "GABC...", "voteType": "for"}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Vote submission requires wallet-signed transaction",
    "proposalId": 0,
    "voter": "GABC...",
    "voteType": "for"
  },
  "timestamp": 1700000000000
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "voteType must be \"for\", \"against\", or \"abstain\"",
  "timestamp": 1700000000000
}
```

---

#### POST `/api/governance/proposals/:id/execute`

Execute a passed proposal (admin-only).

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `number` | Proposal ID |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/governance/proposals/0/execute
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Proposal execution requires admin-signed transaction",
    "proposalId": 0
  },
  "timestamp": 1700000000000
}
```

---

#### POST `/api/governance/proposals/:id/cancel`

Cancel a proposal (proposer/admin only).

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `number` | Proposal ID |

**cURL:**

```bash
curl -X POST http://localhost:3001/api/governance/proposals/0/cancel
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Proposal cancellation requires proposer/admin-signed transaction",
    "proposalId": 0
  },
  "timestamp": 1700000000000
}
```

---

#### GET `/api/governance/health`

Governance service health check.

**cURL:**

```bash
curl http://localhost:3001/api/governance/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "service": "governance",
    "status": "healthy"
  },
  "timestamp": 1700000000000
}
```

---

### Response Format

All endpoints return a consistent response envelope:

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1700000000000
}
```

**Error:**

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": 1700000000000
}
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.0.0 | Runtime |
| npm or yarn | Latest | Package manager |
| Deployed Contracts | — | See [contracts](../contracts/) for deployment |

### Installation

```bash
# Clone the repository
git clone https://github.com/sudo-robi/web3-suite-tooling-backend.git
cd web3-suite-tooling-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (see Environment Variables below)
```

### Configuration

Edit `.env` with your settings:

```bash
# Minimum required configuration
ORACLE_CONTRACT_ID=<deployed-oracle-contract-id>
ANALYTICS_CONTRACT_ID=<deployed-analytics-contract-id>
GOVERNANCE_CONTRACT_ID=<deployed-governance-contract-id>
ADMIN_SECRET_KEY=<your-admin-secret-key>
```

### Running

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

The server starts on `http://localhost:3001` by default.

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

### Stellar Network Passphrases

| Network | Passphrase |
|---------|------------|
| Standalone | `Standalone Network ; February 2017` |
| Testnet | `Test SDF Network ; September 2015` |
| Mainnet | `Public Global Stellar Network ; September 2015` |

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

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS production
RUN apk add --no-cache tini
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 3001
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

| Stage | Purpose |
|-------|---------|
| `deps` | Install production dependencies only |
| `build` | Compile TypeScript to JavaScript |
| `production` | Final minimal image with tini init, non-root user |

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

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

```
services/
├── oracle.test.ts       # Oracle contract interaction tests
├── analytics.test.ts    # Analytics contract interaction tests
└── governance.test.ts   # Governance contract interaction tests
```

---

## Error Handling

### Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success |
| `400` | Bad request (invalid parameters, validation error) |
| `404` | Resource not found |
| `500` | Internal server error |

### AppError Class

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
  }
}
```

Operational errors (validation, not found) throw `AppError` with appropriate status codes. Unhandled errors are caught by the global error handler and return a generic 500 response with the error logged via Winston.

---

## Contributing

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/oracle-pagination` |
| `fix/` | Bug fix | `fix/stale-price-handling` |
| `docs/` | Documentation | `docs/api-reference` |
| `test/` | Adding tests | `test/governance-routes` |
| `refactor/` | Code restructuring | `refactor/service-layer` |

### Commit Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat:` | New feature | `feat: add analytics snapshot endpoint` |
| `fix:` | Bug fix | `fix: handle stale oracle price gracefully` |
| `docs:` | Documentation | `docs: update API reference` |
| `test:` | Adding tests | `test: add governance vote validation` |
| `refactor:` | Code restructuring | `refactor: extract Stellar service layer` |
| `chore:` | Maintenance | `chore: update stellar-sdk to 11.1.0` |

### Development Workflow

```bash
# Before committing, run all checks:
npm run typecheck
npm run lint:fix
npm test
```

### PR Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes following the convention above
4. Push to branch (`git push origin feat/my-feature`)
5. Open a Pull Request with:
   - Description of changes
   - Test results
   - Any environment variable changes

---

## License

[MIT](LICENSE)

Copyright (c) 2024 Web3 Suite contributors
