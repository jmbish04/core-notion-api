/**
 * OpenAPI endpoint
 * Serves dynamic OpenAPI specification in JSON and YAML formats
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

/**
 * GET /openapi.yaml
 * Returns OpenAPI spec in YAML format
 * Note: For simplicity, this returns JSON. In production, use a YAML library.
 */
openapi.get('/openapi.yaml', (c) => {
  const spec = generateOpenAPISpec();
  // TODO: Convert to YAML format using a library like 'js-yaml'
  return c.text(JSON.stringify(spec, null, 2));
});

export default openapi;
