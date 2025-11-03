# Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Notion Proxy Worker                          │
│                    (Cloudflare Worker - Hono Framework)              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         ENTRY POINT                                  │
│  src/index.ts                                                        │
│  ┌───────────────────────────────────────────────────────┐          │
│  │ • CORS Middleware                                      │          │
│  │ • Request Logging                                      │          │
│  │ • Error Handling                                       │          │
│  │ • Route Registration                                   │          │
│  └───────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PUBLIC     │    │   SYSTEM     │    │   API        │
│   ROUTES     │    │   ROUTES     │    │   ROUTES     │
└──────────────┘    └──────────────┘    └──────────────┘
│                   │                   │
│ GET /             │ GET /health       │ /api/* (requires auth)
│ GET /docs         │ GET /monitor      │
│                   │ GET /openapi      │
│                   │                   │
│                   │                   ├─► /api/raw/*
│                   │                   │   (SDK Proxy)
│                   │                   │
│                   │                   └─► /api/flows/*
│                   │                       (Orchestration)
│                   │
│                   └─────────┬──────────────────────┐
│                             │                      │
│                             ▼                      ▼
│                   ┌──────────────┐      ┌──────────────┐
│                   │  MONITORING  │      │   OPENAPI    │
│                   │              │      │  GENERATOR   │
│                   │ • Request    │      │              │
│                   │   Logs       │      │ • Dynamic    │
│                   │ • Flow Runs  │      │   Spec Gen   │
│                   │ • D1 Queries │      │ • 3.1.0      │
│                   └──────────────┘      └──────────────┘

        ┌─────────────────────────────────────────┐
        │         RAW API PROXY LAYER             │
        │         (/api/raw/*)                    │
        ├─────────────────────────────────────────┤
        │                                         │
        │  ┌──────────┐  ┌──────────┐            │
        │  │  Pages   │  │Databases │            │
        │  │          │  │          │            │
        │  │ GET /:id │  │ GET /:id │            │
        │  │ POST /   │  │ POST /:id│            │
        │  │ PATCH /:id  │   /query │            │
        │  └──────────┘  └──────────┘            │
        │                                         │
        │  ┌──────────┐  ┌──────────┐            │
        │  │  Blocks  │  │  Users   │            │
        │  │          │  │  Search  │            │
        │  │ GET /:id │  │ GET /    │            │
        │  │ GET /:id │  │ GET /:id │            │
        │  │  /children  │ POST     │            │
        │  │ PATCH /:id  │  /search │            │
        │  │  /children  │          │            │
        │  └──────────┘  └──────────┘            │
        │                                         │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │      NOTION SDK CLIENT WRAPPER          │
        │      (src/lib/notion.ts)                │
        │                                         │
        │  • Client creation                      │
        │  • Token management                     │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │         NOTION API                      │
        │         (External Service)              │
        └─────────────────────────────────────────┘


        ┌─────────────────────────────────────────┐
        │      FLOW ORCHESTRATION LAYER           │
        │      (/api/flows/*)                     │
        ├─────────────────────────────────────────┤
        │                                         │
        │  ┌─────────────────────────────────┐   │
        │  │ createPageWithBlocks            │   │
        │  │ • Create page with title        │   │
        │  │ • Append content blocks         │   │
        │  │ • Track in D1                   │   │
        │  └─────────────────────────────────┘   │
        │                                         │
        │  ┌─────────────────────────────────┐   │
        │  │ cloneDatabaseSchema             │   │
        │  │ • Read source DB                │   │
        │  │ • Create new DB                 │   │
        │  │ • Copy schema                   │   │
        │  └─────────────────────────────────┘   │
        │                                         │
        │  ┌─────────────────────────────────┐   │
        │  │ searchAndTag                    │   │
        │  │ • Search pages                  │   │
        │  │ • Bulk update properties        │   │
        │  │ • Continue on failures          │   │
        │  └─────────────────────────────────┘   │
        │                                         │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │      FLOW EXECUTION TRACKER             │
        │      (src/lib/logger.ts)                │
        │                                         │
        │  • createFlowRun()                      │
        │  • updateFlowRun()                      │
        │  • Track status & results               │
        └─────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────────┐
        │         D1 DATABASE                     │
        │         (Cloudflare D1)                 │
        ├─────────────────────────────────────────┤
        │                                         │
        │  Tables:                                │
        │  • request_logs                         │
        │    - path, method, status               │
        │    - timestamp, duration                │
        │                                         │
        │  • flow_runs                            │
        │    - flow_name, status                  │
        │    - input/output data                  │
        │    - timestamps                         │
        │                                         │
        └─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       MIDDLEWARE STACK                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    CORS      │  │     Auth     │  │    Error     │             │
│  │              │  │              │  │   Handler    │             │
│  │ • Allow *    │  │ • API Key    │  │              │             │
│  │ • Methods    │  │   Validation │  │ • Consistent │             │
│  │ • Headers    │  │ • Bearer     │  │   Responses  │             │
│  │              │  │   Token      │  │ • Logging    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     VALIDATION LAYER                                 │
│                     (Zod Schemas)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  src/schemas/raw.ts           src/schemas/flows.ts                  │
│  ┌──────────────────┐        ┌──────────────────┐                  │
│  │ • GetPageSchema  │        │ • CreatePageWith │                  │
│  │ • CreatePageSchema         │   BlocksSchema   │                  │
│  │ • QueryDatabaseSchema      │ • CloneDatabase │                  │
│  │ • AppendBlocksSchema       │   SchemaSchema   │                  │
│  │ • SearchSchema   │        │ • SearchAndTag   │                  │
│  └──────────────────┘        │   Schema         │                  │
│                              └──────────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                  UTILITIES & HELPERS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  src/utils/types.ts           src/utils/response.ts                 │
│  • Env interface             • successResponse()                    │
│  • ApiResponse<T>            • errorResponse()                      │
│  • FlowStatus                                                        │
│  • FlowRun                                                           │
│  • RequestLog                                                        │
│                                                                      │
│  src/lib/websocket.ts         src/lib/sse.ts                        │
│  • broadcastMessage()        • createSSEStream()                    │
│  • sendFlowUpdate()          • formatSSEEvent()                     │
│  (Placeholder for future)    (MCP protocol support)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    STATIC ASSETS                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  public/index.html                                                   │
│  • Beautiful landing page                                            │
│  • API documentation                                                 │
│  • Usage examples                                                    │
│  • Authentication guide                                              │
│                                                                      │
│  Embedded in src/index.ts:                                           │
│  • /docs - Interactive HTML documentation                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════
                          DATA FLOW EXAMPLES
════════════════════════════════════════════════════════════════════════

Example 1: Create Page with Blocks Flow
───────────────────────────────────────
Client Request
    │
    ├─► POST /api/flows/createPageWithBlocks
    │   Headers: Authorization: Bearer <key>
    │   Body: { notion_token, parent, title, blocks }
    │
    ▼
Auth Middleware
    │
    ├─► Validate WORKER_API_KEY
    │
    ▼
Flow Handler (createPageWithBlocks.ts)
    │
    ├─► 1. Validate input with Zod schema
    ├─► 2. Create flow run in D1
    ├─► 3. Create Notion client
    ├─► 4. Create page with title
    ├─► 5. Append blocks to page
    ├─► 6. Update flow run status
    ├─► 7. Return success response
    │
    ▼
Response: { success: true, data: { page, blocks } }


Example 2: Query Database
─────────────────────────
Client Request
    │
    ├─► POST /api/raw/databases/:id/query
    │   Headers: 
    │     Authorization: Bearer <worker_key>
    │     x-notion-token: <notion_token>
    │   Body: { filter, sorts }
    │
    ▼
Auth Middleware → Validate WORKER_API_KEY
    │
    ▼
Database Handler (databases.ts)
    │
    ├─► 1. Validate x-notion-token header
    ├─► 2. Validate request body with Zod
    ├─► 3. Create Notion client
    ├─► 4. Call notion.databases.query()
    ├─► 5. Return results
    │
    ▼
Response: { success: true, data: { results: [...] } }


Example 3: Health Check
───────────────────────
Client Request
    │
    ├─► GET /health
    │
    ▼
Health Handler (health.ts)
    │
    ├─► Calculate uptime
    ├─► Return status
    │
    ▼
Response: { success: true, data: { status: "ok", uptime: 123 } }

════════════════════════════════════════════════════════════════════════
