/**
 * Raw API proxy for Notion Databases endpoints
 * Mirrors the Notion SDK databases operations
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { QueryDatabaseSchema } from '../../schemas/raw';

const databases = new Hono<{ Bindings: Env }>();

/**
 * GET /api/raw/databases/:database_id
 * Retrieve a database by ID
 */
databases.get('/:database_id', async (c) => {
  try {
    const database_id = c.req.param('database_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const database = await notion.databases.retrieve({ database_id });

    return c.json(successResponse(database));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to retrieve database'), 500);
  }
});

/**
 * POST /api/raw/databases/:database_id/query
 * Query a database
 */
databases.post('/:database_id/query', async (c) => {
  try {
    const database_id = c.req.param('database_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const body = await c.req.json();
    const validated = QueryDatabaseSchema.parse({ ...body, database_id });

    const notion = createNotionClient(notion_token);
    const results = await (notion.databases as any).query(validated as any);

    return c.json(successResponse(results));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to query database'), 500);
  }
});

export default databases;
