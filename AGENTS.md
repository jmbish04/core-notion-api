# AGENTS.md — Architecture & Role Definitions

This document defines the modular AI agent responsibilities for the `notion-proxy-worker` project.  
Each agent (or module) is designed for autonomous, composable development and orchestration.

---

## 1. 🏗️ Core System Agents

### **Router Agent**
- **Goal:** Maintain top-level route registration and middleware wiring.
- **Responsibilities:**
  - Register `/api/raw`, `/api/flows`, `/health`, `/monitor`, `/openapi` routes.
  - Apply authentication, error handling, and CORS middleware.
  - Serve static assets from the `/public` folder via `assets` binding.
- **Success Criteria:** Stable routing tree, zero middleware conflicts, predictable error responses.

---

### **Proxy Agent (`/api/raw`)**
- **Goal:** Mirror Notion SDK endpoints through REST + WebSocket interface.
- **Responsibilities:**
  - Wrap each Notion SDK client call (`pages`, `databases`, `blocks`, `users`, etc.).
  - Enforce authentication using `env.WORKER_API_KEY`.
  - Log all requests and responses to the D1 database.
  - Auto-generate Zod schemas for each endpoint and expose them to OpenAPI generator.
- **Success Criteria:** One-to-one SDK parity, type-safe schema validation, consistent API responses.

---

### **Flow Agent (`/api/flows`)**
- **Goal:** Define and orchestrate multi-step workflows (“well-lit paths”).
- **Responsibilities:**
  - Combine raw SDK actions into high-level, atomic flows:
    - `createPageWithBlocks`
    - `cloneDatabaseSchema`
    - `searchAndTag`
    - `orchestrateMarkdownToPages`
  - Manage transactional consistency (rollback on failure).
  - Emit real-time progress via WebSocket and SSE.
- **Success Criteria:** Simplified developer experience, traceable flow runs, consistent states.

---

### **OpenAPI Agent**
- **Goal:** Generate dynamic OpenAPI 3.1.0 specs optimized for ChatGPT Custom Actions.
- **Responsibilities:**
  - Reflect live route schemas using `zod-to-openapi`.
  - Expose `/openapi.json` and `/openapi.yaml`.
  - Annotate authentication, example payloads, and AI-optimized descriptions.
- **Success Criteria:** Accurate and human-readable documentation, usable by OpenAI Custom Actions.

---

### **Frontend Agent**
- **Goal:** Serve Mantine + Vite frontend UI from `public` directory.
- **Responsibilities:**
  - Implement pages:
    - `/docs` → interactive spec explorer backed by `/openapi.json`
    - `/monitor` → D1 logs and worker uptime (Mantine tables)
    - `/flows` → trigger orchestrated flows + subscribe to SSE updates
  - Use `useWorkerClient()` hook to interact with Worker endpoints.
  - Surface real-time flow telemetry via EventSource/WebSocket bridges.
- **Success Criteria:** Lightweight UI, real-time feedback, full coverage of backend capabilities.

---

## 2. ⚙️ Support Agents

### **Auth Agent**
- **Goal:** Handle API key authentication and enforcement.
- **Responsibilities:** Validate `Authorization: Bearer <WORKER_API_KEY>` header before every request.

### **Logger Agent**
- **Goal:** Centralize logging to D1 (request logs, flow events, errors).
- **Responsibilities:** Provide a typed logging API with structured metadata (route, timestamp, status).

### **WebSocket Agent**
- **Goal:** Manage WebSocket sessions for `/ws/*` routes.
- **Responsibilities:** Stream flow updates and logs to clients; fallback to MCP SSE when required.
  - Durable Object: `FlowMonitorDO` (binding `FLOW_MONITOR`, migration `v1`).
  - Routes:
    - `/ws/flow-updates/:flowId` → WebSocket broadcast via DO
    - `/mcp/stream/:flowId` → SSE bridge for MCP / EventSource clients

### **SSE Agent**
- **Goal:** Serve as MCP-compatible event stream for `/mcp/stream`.
- **Responsibilities:** Bridge flow events into SSE format (`event: message`, `data: {...}`).

---

## 3. 🧩 Observability & Orchestration

### **Monitor Agent**
- **Goal:** Display worker health and telemetry.
- **Responsibilities:**
  - Aggregate metrics (uptime, error rate, D1 write latency).
  - Render results in `/monitor` dashboard.
  - Provide `/health` JSON endpoint (`status`, `uptime`, `timestamp`).

---

## 4. 🧠 Agent Interplay

- **Router Agent** → registers all sub-agents.
- **Proxy Agent** → wraps SDK calls.
- **Flow Agent** → orchestrates Proxy operations.
- **OpenAPI Agent** → documents all routes.
- **Frontend Agent** → visualizes system and runs flows.
- **Logger/WebSocket/SSE/Auth Agents** → enforce consistency, security, and live introspection.

---

## 5. 🔮 Expansion Hooks

- `Vector Agent` — optional future module for embedding-based page search and tagging.
- `Cache Agent` — optional layer for KV caching of frequent Notion lookups.
- `Audit Agent` — optional tool for compliance logging and metrics analytics.

---

**Summary:**  
The `notion-proxy-worker` is designed as a composable, agent-driven system.  
Each module operates as an autonomous “agent” with clear boundaries and shared standards for logging, validation, and orchestration.  
This structure enables Copilot or other AI systems to contribute incrementally and coherently.
