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
app.get('/docs', async (c) => {
  const docsHtml = await c.env.ASSETS.fetch(new URL('/docs.html', c.req.url));
  if (docsHtml.ok) {
    return new Response(docsHtml.body, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }
  return c.notFound();
});

export default app;
