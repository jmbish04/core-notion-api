/**
 * Raw API router aggregator
 * Combines all raw SDK proxy endpoints
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import pages from './pages';
import databases from './databases';
import blocks from './blocks';
import users from './users';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { SearchSchema } from '../../schemas/raw';

const raw = new Hono<{ Bindings: Env }>();

// Mount sub-routers
raw.route('/pages', pages);
raw.route('/databases', databases);
raw.route('/blocks', blocks);
raw.route('/users', users);

/**
 * POST /api/raw/search
 * Search pages and databases (top-level endpoint)
 */
raw.post('/search', async (c) => {
  try {
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const body = await c.req.json();
    const validated = SearchSchema.parse(body);

    const notion = createNotionClient(notion_token);
    const results = await notion.search(validated as any);

    return c.json(successResponse(results));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to search'), 500);
  }
});

export default raw;
