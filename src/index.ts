/**
 * Notion Proxy Worker - Main Entry Point
 * Cloudflare Worker that provides a proxy and orchestration layer for the Notion SDK
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from './utils/types';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logRequest } from './lib/logger';
import { streamFlowUpdates } from './lib/sse';

// Import routes
import health from './routes/health';
import monitor from './routes/monitor';
import openapi from './routes/openapi';
import raw from './routes/raw/index';
import flows from './routes/flows/index';
import { errorResponse } from './utils/response';

function serveSpa(c: Context<{ Bindings: Env }>) {
  return c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
}

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
app.get('/ws/flow-updates/:flowId', (c) => {
  const id = c.env.FLOW_MONITOR.idFromName(c.req.param('flowId'));
  const stub = c.env.FLOW_MONITOR.get(id);
  return stub.fetch(c.req.raw);
});

// Protected API routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/raw', raw);
app.route('/api/flows', flows);

app.get('/mcp/stream/:flowId', (c) => {
  const headerAuth = c.req.header('authorization');
  const queryAuth = c.req.query('apiKey');
  const token = headerAuth?.replace(/^Bearer\s+/i, '') ?? queryAuth;
  if (token !== c.env.WORKER_API_KEY) {
    return c.json(errorResponse('Unauthorized'), 401);
  }
  return streamFlowUpdates(c, c.req.param('flowId'));
});

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
app.get('/assets/*', (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/favicon.ico', (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/docs', serveSpa);
app.get('/monitor', serveSpa);
app.get('/flows', serveSpa);

export default app;
export { FlowMonitorDO } from './lib/flow_monitor_do';
