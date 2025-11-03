/**
 * Authentication middleware
 * Validates API key from Authorization header
 */

import type { Context, Next } from 'hono';
import type { Env } from '../utils/types';

/**
 * Middleware to validate API key authentication
 * Checks Authorization header against WORKER_API_KEY environment variable
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('authorization');
  const expectedKey = c.env.WORKER_API_KEY;

  // Allow requests without API key if WORKER_API_KEY is not set (development mode)
  if (!expectedKey) {
    console.warn('WORKER_API_KEY not set - authentication disabled');
    return next();
  }

  if (!authHeader) {
    return c.json({ error: 'Unauthorized - Missing Authorization header' }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (token !== expectedKey) {
    return c.json({ error: 'Unauthorized - Invalid API key' }, 401);
  }

  await next();
}
