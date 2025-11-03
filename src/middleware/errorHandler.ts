/**
 * Global error handler middleware
 * Catches and formats errors consistently
 */

import type { Context } from 'hono';
import { errorResponse } from '../utils/response';

/**
 * Global error handler for the Hono application
 * Formats errors into consistent API responses
 */
export function errorHandler(err: Error, c: Context): Response {
  console.error('Error:', err);

  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal server error';

  return c.json(errorResponse(message), status as any);
}
