/**
 * OpenAPI endpoint
 * Serves dynamic OpenAPI specification in JSON format
 */

import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { generateOpenAPISpec } from '../lib/openapi';

const openapi = new Hono<{ Bindings: Env }>();

/**
 * GET /openapi
 * Returns OpenAPI spec in JSON format
 */
openapi.get('/', (c) => {
  const spec = generateOpenAPISpec();
  return c.json(spec);
});

/**
 * GET /openapi.json
 * Returns OpenAPI spec in JSON format
 */
openapi.get('/openapi.json', (c) => {
  const spec = generateOpenAPISpec();
  return c.json(spec);
});

export default openapi;
