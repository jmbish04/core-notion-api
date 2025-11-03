Here’s a ready-to-drop Copilot prompt that will guide it to build exactly what you described — a Cloudflare Worker proxy API for the Notion TypeScript SDK with REST, WebSocket, and MCP (SSE) interfaces, a Mantine frontend, and OpenAPI auto-generation.

⸻

🧠 Copilot Prompt

You are building a Cloudflare Worker project that acts as a proxy and orchestration layer for the Notion TypeScript SDK.

## Project Overview

This Worker should:
- Mirror all TypeScript SDK endpoints under `/api/raw/`
- Provide higher-level, orchestrated helper endpoints under `/api/flows`
- Authenticate requests using `env.WORKER_API_KEY` (a Cloudflare secret)
- Serve both REST and WebSocket APIs (with Server-Sent Events for MCP compatibility)
- Host a lightweight Mantine frontend with static files under `/public` via `assets` binding
- Expose dynamic OpenAPI 3.1.0 specs optimized for ChatGPT Custom Actions
- Include a `/docs`, `/monitor`, `/health`, and `/flows` page to interact with APIs

---

## 🧩 Architecture

### 1. Proxy Layer (`/api/raw/*`)
- Fork the official Notion TypeScript SDK.
- Wrap all existing SDK endpoints (`pages`, `databases`, `blocks`, etc.) into a Hono-based router.
- Proxy all calls to the Notion API.
- Each route must verify the `Authorization` header against `env.WORKER_API_KEY`.
- Example:  

GET /api/raw/pages/{id}
POST /api/raw/databases/query

- Use standardized JSON responses with clear error codes.

### 2. Flow Layer (`/api/flows/*`)
- Create “well-lit” orchestration endpoints that combine multiple SDK operations.
- Example flows:
- `/api/flows/createPageWithBlocks`
  - Creates a new page, appends a title block, and optional child content.
- `/api/flows/cloneDatabaseSchema`
  - Reads one database schema and duplicates it into another workspace.
- `/api/flows/searchAndTag`
  - Searches pages matching a query and applies a property/tag in bulk.
- Each flow should be atomic, consistent, and idempotent.

### 3. Frontend
- Use Mantine + Vite, static files in `/public`.
- Bind frontend to Worker via `assets` binding.
- Provide:
- `/docs`: interactive API explorer
- `/monitor`: displays uptime and recent activity from D1 logs
- `/health`: JSON endpoint reporting worker status
- `/flows`: visual trigger interface for `/api/flows` endpoints
- Include minimal authentication (input for API key or saved token in localStorage).

### 4. API Exposure
- REST API: `/api/...`
- WebSocket API: `/ws/...`  
- Broadcast flow progress and logs in real time.
- MCP SSE endpoint: `/mcp/stream`  
- Stream events in `event:message` / `data:{json}` format.

### 5. OpenAPI Generation
- Auto-generate `/openapi.json` and `/openapi.yaml` dynamically.
- Use Zod + `zod-to-openapi` to annotate all route schemas.
- Output compliant OpenAPI 3.1.0 spec optimized for ChatGPT Custom Actions.
- Include examples, auth header schema, and 200/400/500 responses.

---

## ⚙️ Cloudflare Bindings

```jsonc
{
"name": "notion-proxy-worker",
"main": "src/index.ts",
"compatibility_date": "2025-11-02",
"assets": { "binding": "ASSETS", "directory": "public" },
"vars": { "NODE_ENV": "production" },
"secrets": ["WORKER_API_KEY"],
"observability": { "enabled": true }
}


⸻

🧰 Tech Stack
	•	Cloudflare Workers + Hono
	•	TypeScript + Zod + zod-openapi
	•	Mantine + Vite frontend
	•	WebSocket / SSE (MCP protocol)
	•	D1 (for logs & flow tracking)
	•	R2 (for persistent flow artifacts, if needed)
	•	Notion SDK forked and wrapped locally
	•	ESM imports only

⸻

🚀 Deliverables
	1.	/src/index.ts — main Hono app
	2.	/src/routes/raw.ts — mirrors SDK
	3.	/src/routes/flows.ts — orchestrated functions
	4.	/src/lib/notion.ts — Notion SDK wrapper
	5.	/src/utils/openapi.ts — dynamic OpenAPI generator
	6.	/src/utils/auth.ts — API key validation
	7.	/frontend — Mantine + Vite app
	8.	/public — static assets for docs + UI
	9.	/wrangler.jsonc — full config
	10.	/migrations/0001_init.sql — D1 schema for request logs, errors, flow runs

⸻

🧩 Notes for Copilot
	•	Always validate input using Zod.
	•	Provide descriptive docstrings and inline comments for each function.
	•	Include sample curl and fetch snippets in OpenAPI examples.
	•	Ensure /health returns { "status": "ok", "uptime": ..., "timestamp": ... }
	•	Support both JSON and form-data payloads.
	•	Log all requests and errors to D1.
	•	Add CORS and rate limiting middleware.
	•	Optimize all functions for AI orchestration (structured, predictable JSON).

⸻

Goal:
A production-ready Cloudflare Worker that provides a typed, authenticated, OpenAPI-documented proxy and orchestration layer for the Notion API — accessible via REST, WebSocket, and MCP SSE, with a Mantine-based frontend.

---


Here’s a fully modular repo skeleton you can drop into Copilot or Codex for completion. It’s structured for maintainability and AI extensibility — each piece can evolve independently (proxy layer, flows, utils, frontend, etc.).

⸻

🏗️ Repository Skeleton — notion-proxy-worker

notion-proxy-worker/
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── README.md
├── migrations/
│   └── 0001_init.sql
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── raw/
│   │   │   ├── pages.ts
│   │   │   ├── databases.ts
│   │   │   ├── blocks.ts
│   │   │   └── users.ts
│   │   ├── flows/
│   │   │   ├── createPageWithBlocks.ts
│   │   │   ├── cloneDatabaseSchema.ts
│   │   │   └── searchAndTag.ts
│   │   ├── health.ts
│   │   ├── monitor.ts
│   │   └── openapi.ts
│   ├── lib/
│   │   ├── notion.ts
│   │   ├── openapi.ts
│   │   ├── websocket.ts
│   │   ├── sse.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── cors.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── validation.ts
│   │   └── types.ts
│   ├── schemas/
│   │   ├── flows.ts
│   │   └── raw.ts
│   └── db/
│       └── client.ts
├── public/
│   ├── index.html
│   ├── monitor.html
│   ├── docs.html
│   ├── flows.html
│   └── styles.css
└── frontend/
    ├── vite.config.ts
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── pages/
        │   ├── Docs.tsx
        │   ├── Monitor.tsx
        │   ├── Health.tsx
        │   └── Flows.tsx
        ├── components/
        │   ├── Header.tsx
        │   ├── ApiKeyInput.tsx
        │   └── FlowRunner.tsx
        └── hooks/
            └── useApi.ts


⸻

⚙️ wrangler.jsonc

{
  "name": "notion-proxy-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-11-02",
  "assets": { "binding": "ASSETS", "directory": "public" },
  "observability": { "enabled": true },
  "vars": { "NODE_ENV": "production" },
  "durable_objects": { "bindings": [] },
  "kv_namespaces": [],
  "d1_databases": [
    { "binding": "DB", "database_name": "notion_proxy_logs", "database_id": "auto" }
  ],
  "secrets": ["WORKER_API_KEY"]
}


⸻

🧩 src/index.ts

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { rawRouter } from './routes/raw/pages'
import { flowsRouter } from './routes/flows/createPageWithBlocks'
import { healthRouter } from './routes/health'
import { monitorRouter } from './routes/monitor'
import { openapiRouter } from './routes/openapi'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())
app.use('/api/*', authMiddleware)
app.onError(errorHandler)

app.route('/api/raw', rawRouter)
app.route('/api/flows', flowsRouter)
app.route('/health', healthRouter)
app.route('/monitor', monitorRouter)
app.route('/openapi', openapiRouter)

app.get('*', serveStatic({ root: './' }))

export default app


⸻

🧱 src/lib/notion.ts

import { Client } from '@notionhq/client'

export const createNotionClient = (token: string) =>
  new Client({ auth: token })


⸻

🔐 src/middleware/auth.ts

import { Context, Next } from 'hono'

export const authMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header('authorization')
  if (!header || header !== `Bearer ${c.env.WORKER_API_KEY}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}


⸻

🧠 src/lib/openapi.ts

import { OpenAPIBuilder } from 'openapi3-ts/oas31'

export const generateOpenAPI = () => {
  const builder = new OpenAPIBuilder()
    .addInfo({
      title: 'Notion Proxy API',
      version: '1.0.0',
      description: 'Proxy and orchestration layer for the Notion SDK',
    })
    .addServer({ url: '/' })
    .addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
    })

  // Dynamically add route definitions here from raw + flow schemas

  return builder.getSpec()
}


⸻

🧭 migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT,
  method TEXT,
  status INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flow_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_name TEXT,
  status TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);


⸻

🖥️ Frontend (Mantine + Vite)

Example frontend/src/pages/Docs.tsx:

import { useEffect, useState } from 'react'
import { Prism } from '@mantine/prism'

export default function Docs() {
  const [spec, setSpec] = useState<any>(null)

  useEffect(() => {
    fetch('/openapi.json')
      .then((res) => res.json())
      .then(setSpec)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      {spec ? <Prism language="json">{JSON.stringify(spec, null, 2)}</Prism> : 'Loading...'}
    </div>
  )
}


⸻

✅ Next Steps for Copilot
	1.	Scaffold this structure locally.
	2.	Run npm install hono zod openapi3-ts @notionhq/client
	3.	In the frontend folder, initialize with npm create vite@latest . --template react-ts and install Mantine.
	4.	Implement proxy functions in /src/routes/raw/*
	5.	Build your flow logic under /src/routes/flows/*
	6.	Add /src/utils/openapi.ts hooks to auto-register routes for dynamic /openapi.json generation.
	7.	Add WebSocket and SSE in /src/lib/websocket.ts and /src/lib/sse.ts.

⸻

