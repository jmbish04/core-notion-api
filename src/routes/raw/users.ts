/**
 * Raw API proxy for Notion Users and Search endpoints
 * Mirrors the Notion SDK users and search operations
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { SearchSchema } from '../../schemas/raw';

const users = new Hono<{ Bindings: Env }>();

/**
 * GET /api/raw/users
 * List all users
 */
users.get('/', async (c) => {
  try {
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const usersList = await notion.users.list({});

    return c.json(successResponse(usersList));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to list users'), 500);
  }
});

/**
 * GET /api/raw/users/:user_id
 * Retrieve a user by ID
 */
users.get('/:user_id', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const user = await notion.users.retrieve({ user_id });

    return c.json(successResponse(user));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to retrieve user'), 500);
  }
});

/**
 * POST /api/raw/search
 * Search pages and databases
 */
users.post('/search', async (c) => {
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

export default users;
