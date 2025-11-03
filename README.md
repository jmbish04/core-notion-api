# Notion Proxy Worker

A Cloudflare Worker that provides a comprehensive REST API proxy and orchestration layer for the [Notion SDK](https://github.com/makenotion/notion-sdk-js).

## Features

- **REST API Proxy** - Direct access to all Notion SDK endpoints under `/api/raw/*`
- **Flow Orchestration** - High-level workflows combining multiple Notion operations under `/api/flows/*`
- **OpenAPI 3.1.0** - Auto-generated specification optimized for ChatGPT Custom Actions
- **Authentication** - Secure API key-based authentication
- **Request Logging** - D1 database integration for tracking requests and flows
- **Real-time Updates** - WebSocket and SSE support for flow progress (future enhancement)
- **Type Safety** - Full TypeScript implementation with Zod validation

## Architecture

This worker follows a modular agent-driven architecture as defined in `AGENTS.md`:

- **Router Agent** - Main application routing and middleware
- **Proxy Agent** (`/api/raw`) - Direct SDK operation proxying
- **Flow Agent** (`/api/flows`) - Multi-step orchestrated workflows
- **OpenAPI Agent** - Dynamic API documentation generation
- **Monitor Agent** - Observability and logging
- **Auth Agent** - API key validation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Notion integration](https://developers.notion.com/docs/getting-started) with API token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jmbish04/core-notion-api.git
cd core-notion-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up Cloudflare D1 database:
```bash
# Create D1 database
wrangler d1 create notion_proxy_logs

# Update wrangler.jsonc with the database_id from the output

# Run migrations
wrangler d1 migrations apply notion_proxy_logs --local
```

4. Configure secrets:
```bash
# Set the worker API key
wrangler secret put WORKER_API_KEY
```

5. Run locally:
```bash
npm run dev
```

6. Deploy to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

### System Routes

- `GET /` - API information and endpoints list
- `GET /health` - Worker health check and uptime
- `GET /monitor` - Request logs and flow runs (requires auth)
- `GET /openapi` - OpenAPI 3.1.0 specification
- `GET /docs` - Interactive HTML documentation

### Raw API Endpoints (`/api/raw/*`)

Direct proxy to Notion SDK operations. All endpoints require:
- `Authorization: Bearer <WORKER_API_KEY>` header
- `x-notion-token: <notion-integration-token>` header

**Pages:**
- `GET /api/raw/pages/:page_id` - Retrieve a page
- `POST /api/raw/pages` - Create a page
- `PATCH /api/raw/pages/:page_id` - Update a page

**Databases:**
- `GET /api/raw/databases/:database_id` - Retrieve a database
- `POST /api/raw/databases/:database_id/query` - Query a database

**Blocks:**
- `GET /api/raw/blocks/:block_id` - Retrieve a block
- `GET /api/raw/blocks/:block_id/children` - Get block children
- `PATCH /api/raw/blocks/:block_id/children` - Append blocks

**Search:**
- `POST /api/raw/search` - Search pages and databases

**Users:**
- `GET /api/raw/users` - List all users
- `GET /api/raw/users/:user_id` - Retrieve a user

### Flow Orchestration (`/api/flows/*`)

High-level workflows that combine multiple Notion operations. All endpoints require:
- `Authorization: Bearer <WORKER_API_KEY>` header
- `notion_token` in request body

**Available Flows:**
- `POST /api/flows/createPageWithBlocks` - Create a page with title and content blocks
- `POST /api/flows/cloneDatabaseSchema` - Clone a database schema to a new location
- `POST /api/flows/searchAndTag` - Search pages and bulk update properties

## Example Usage

### Create a Page with Blocks

```bash
curl -X POST https://your-worker.workers.dev/api/flows/createPageWithBlocks \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notion_token": "YOUR_NOTION_TOKEN",
    "parent": { "page_id": "PARENT_PAGE_ID" },
    "title": "Project Notes",
    "blocks": [
      {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
          "rich_text": [{ 
            "type": "text", 
            "text": { "content": "Meeting notes from today..." }
          }]
        }
      }
    ]
  }'
```

### Query a Database

```bash
curl -X POST https://your-worker.workers.dev/api/raw/databases/DATABASE_ID/query \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY" \
  -H "x-notion-token: YOUR_NOTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Status",
      "select": { "equals": "In Progress" }
    },
    "sorts": [
      { "property": "Created", "direction": "descending" }
    ]
  }'
```

## Development

### Project Structure

```
.
├── src/
│   ├── index.ts              # Main Hono application
│   ├── routes/
│   │   ├── raw/              # SDK proxy endpoints
│   │   ├── flows/            # Orchestration workflows
│   │   ├── health.ts         # Health check
│   │   ├── monitor.ts        # Monitoring
│   │   └── openapi.ts        # API documentation
│   ├── lib/
│   │   ├── notion.ts         # Notion client wrapper
│   │   ├── logger.ts         # D1 database logging
│   │   ├── openapi.ts        # OpenAPI spec generator
│   │   ├── websocket.ts      # WebSocket utilities
│   │   └── sse.ts            # Server-Sent Events
│   ├── middleware/
│   │   ├── auth.ts           # Authentication
│   │   ├── cors.ts           # CORS configuration
│   │   └── errorHandler.ts  # Error handling
│   ├── schemas/
│   │   ├── raw.ts            # Zod schemas for raw endpoints
│   │   └── flows.ts          # Zod schemas for flows
│   └── utils/
│       ├── types.ts          # TypeScript type definitions
│       └── response.ts       # Response utilities
├── migrations/
│   └── 0001_init.sql         # D1 database schema
├── public/
│   └── index.html            # Landing page
├── wrangler.jsonc            # Cloudflare Worker config
├── AGENTS.md                 # Architecture documentation
└── PROMPT.md                 # Implementation guide
```

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local development server with Wrangler |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run typecheck` | Type check with TypeScript |
| `npm run build` | Build the project |
| `npm run format` | Format code with Prettier |

### Adding New Endpoints

1. Define Zod schema in `src/schemas/`
2. Create route handler in `src/routes/`
3. Register route in appropriate router (raw or flows)
4. Update OpenAPI spec in `src/lib/openapi.ts`

## Testing

View monitoring data:
```bash
curl https://your-worker.workers.dev/monitor \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY"
```

Check health status:
```bash
curl https://your-worker.workers.dev/health
```

## Configuration

### Environment Variables

Set in `wrangler.jsonc` or via Wrangler CLI:

- `WORKER_API_KEY` - Secret API key for authentication (set via `wrangler secret put`)
- `NODE_ENV` - Environment mode (production/development)

### Cloudflare Bindings

- `DB` - D1 database for request logs and flow tracking
- `ASSETS` - Static asset serving from `/public` directory

## Documentation

- `AGENTS.md` - Detailed architecture and module responsibilities
- `PROMPT.md` - Implementation guide and technical specifications
- `/openapi` - Live OpenAPI specification
- `/docs` - Interactive API documentation

## Contributing

This project follows the modular agent architecture defined in `AGENTS.md`. Each module should:
- Have clear boundaries and responsibilities
- Use public interfaces for cross-module communication
- Include comprehensive JSDoc comments
- Validate inputs with Zod schemas
- Follow TypeScript strict mode

## License

This project is based on the [Notion SDK TypeScript starter template](https://github.com/makenotion/notion-sdk-typescript-starter).

## Resources

- [Notion API Documentation](https://developers.notion.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

