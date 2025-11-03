/**
 * Raw API proxy for Notion Blocks endpoints
 * Mirrors the Notion SDK blocks operations
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { GetBlockSchema, AppendBlocksSchema } from '../../schemas/raw';

const blocks = new Hono<{ Bindings: Env }>();

/**
 * GET /api/raw/blocks/:block_id
 * Retrieve a block by ID
 */
blocks.get('/:block_id', async (c) => {
  try {
    const block_id = c.req.param('block_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const block = await notion.blocks.retrieve({ block_id });

    return c.json(successResponse(block));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to retrieve block'), 500);
  }
});

/**
 * GET /api/raw/blocks/:block_id/children
 * Retrieve children of a block
 */
blocks.get('/:block_id/children', async (c) => {
  try {
    const block_id = c.req.param('block_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const notion = createNotionClient(notion_token);
    const children = await notion.blocks.children.list({ block_id });

    return c.json(successResponse(children));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to retrieve block children'), 500);
  }
});

/**
 * PATCH /api/raw/blocks/:block_id/children
 * Append blocks to a parent block
 */
blocks.patch('/:block_id/children', async (c) => {
  try {
    const block_id = c.req.param('block_id');
    const notion_token = c.req.header('x-notion-token');

    if (!notion_token) {
      return c.json(errorResponse('Missing x-notion-token header'), 400);
    }

    const body = await c.req.json();
    const validated = AppendBlocksSchema.parse({ ...body, block_id });

    const notion = createNotionClient(notion_token);
    const result = await notion.blocks.children.append(validated as any);

    return c.json(successResponse(result));
  } catch (error: any) {
    return c.json(errorResponse(error.message || 'Failed to append blocks'), 500);
  }
});

export default blocks;
