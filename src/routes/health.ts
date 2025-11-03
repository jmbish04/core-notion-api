/**
 * Health check endpoint
 * Reports worker status and uptime
 */

import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { successResponse } from '../utils/response';

const health = new Hono<{ Bindings: Env }>();

const startTime = Date.now();

/**
 * GET /health
 * Returns worker health status
 */
health.get('/', (c) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  return c.json(
    successResponse({
      status: 'ok',
      uptime,
      timestamp: new Date().toISOString(),
      environment: c.env.NODE_ENV || 'development',
    })
  );
});

export default health;
