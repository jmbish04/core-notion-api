/**
 * Notion Proxy Worker - Main Entry Point
 * Cloudflare Worker that provides a proxy and orchestration layer for the Notion SDK
 */

import { Hono } from 'hono';
import type { Env } from './utils/types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logRequest } from './lib/logger';

// Import routes
import health from './routes/health';
import monitor from './routes/monitor';
import openapi from './routes/openapi';
import raw from './routes/raw/index';
import flows from './routes/flows/index';

// Create main Hono application
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', corsMiddleware);
app.onError(errorHandler);

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  // Log request asynchronously (don't await to avoid slowing down responses)
  c.executionCtx?.waitUntil(
    logRequest(c.env, {
      path: c.req.path,
      method: c.req.method,
      status: c.res.status,
      user_agent: c.req.header('user-agent'),
      duration_ms: duration,
    })
  );
});

// Public routes (no auth required)
app.route('/health', health);
app.route('/openapi', openapi);

// Protected API routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/raw', raw);
app.route('/api/flows', flows);

// Protected monitoring route
app.use('/monitor', authMiddleware);
app.route('/monitor', monitor);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Notion Proxy Worker',
    version: '1.0.0',
    description: 'Cloudflare Worker proxy and orchestration layer for the Notion SDK',
    endpoints: {
      health: '/health',
      openapi: '/openapi',
      monitor: '/monitor',
      raw_api: '/api/raw/*',
      flows: '/api/flows/*',
    },
    documentation: '/openapi',
  });
});

// Static file serving (for frontend assets)
// Note: In production, this would be handled by the assets binding
app.get('/docs', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notion Proxy API - Documentation</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { color: #333; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    .endpoint { margin: 2rem 0; padding: 1rem; border-left: 4px solid #007bff; background: #f8f9fa; }
  </style>
</head>
<body>
  <h1>Notion Proxy API Documentation</h1>
  <p>Welcome to the Notion Proxy Worker API. This service provides a REST interface to the Notion SDK.</p>
  
  <h2>Quick Start</h2>
  <p>View the full OpenAPI specification: <a href="/openapi">/openapi</a></p>
  
  <div class="endpoint">
    <h3>Health Check</h3>
    <p>GET /health - Check worker status</p>
  </div>
  
  <div class="endpoint">
    <h3>Monitor</h3>
    <p>GET /monitor - View request logs and flow runs (requires auth)</p>
  </div>
  
  <div class="endpoint">
    <h3>Raw API</h3>
    <p>Proxy endpoints for Notion SDK operations:</p>
    <ul>
      <li>GET /api/raw/pages/:page_id</li>
      <li>POST /api/raw/pages</li>
      <li>GET /api/raw/databases/:database_id</li>
      <li>POST /api/raw/databases/:database_id/query</li>
      <li>POST /api/raw/search</li>
    </ul>
  </div>
  
  <div class="endpoint">
    <h3>Flows</h3>
    <p>Orchestrated multi-step operations:</p>
    <ul>
      <li>POST /api/flows/createPageWithBlocks</li>
      <li>POST /api/flows/cloneDatabaseSchema</li>
      <li>POST /api/flows/searchAndTag</li>
    </ul>
  </div>
  
  <h2>Authentication</h2>
  <p>Protected endpoints require the <code>Authorization: Bearer &lt;WORKER_API_KEY&gt;</code> header.</p>
  <p>Raw API endpoints require the <code>x-notion-token</code> header with your Notion integration token.</p>
</body>
</html>
  `);
});

export default app;
