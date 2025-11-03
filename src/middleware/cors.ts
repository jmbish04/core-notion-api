/**
 * CORS middleware configuration
 * Enables cross-origin requests for the API
 */

import { cors } from 'hono/cors';

/**
 * CORS middleware with permissive settings for development
 * In production, you should restrict origins appropriately
 */
export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});
