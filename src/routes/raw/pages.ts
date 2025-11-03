/**
 * Raw API proxy for Notion Pages endpoints
 * Mirrors the Notion SDK pages operations
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { GetPageSchema, CreatePageSchema, UpdatePageSchema } from '../../schemas/raw';

const pages = new Hono<{ Bindings: Env }>();

/**
 * GET /api/raw/pages/:page_id
 * Retrieve a page by ID
 */
pages.get('/:page_id', async (c) => {
  try {
    const page_id = c.req.param('page_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const page = await notion.pages.retrieve({ page_id });

    return c.json(successResponse(page));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to retrieve page'), 500);
  }
});

/**
 * POST /api/raw/pages
 * Create a new page
 */
pages.post('/', async (c) => {
  try {
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const body = await c.req.json();
    const validated = CreatePageSchema.parse(body);

    const notion = createNotionClient(notion_token);
    const page = await notion.pages.create(validated as any);

    return c.json(successResponse(page));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to create page'), 500);
  }
});

/**
 * PATCH /api/raw/pages/:page_id
 * Update a page
 */
pages.patch('/:page_id', async (c) => {
  try {
    const page_id = c.req.param('page_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const body = await c.req.json();
    const validated = UpdatePageSchema.parse({ ...body, page_id });

    const notion = createNotionClient(notion_token);
    const page = await notion.pages.update(validated as any);

    return c.json(successResponse(page));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to update page'), 500);
  }
});

export default pages;
