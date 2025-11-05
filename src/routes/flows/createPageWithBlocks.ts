/**
 * Flow: Create Page with Blocks
 * Orchestrated operation to create a page with title and content blocks
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { createFlowRun, updateFlowRun } from '../../lib/logger';
import { CreatePageWithBlocksSchema } from '../../schemas/flows';
import { sendFlowUpdate } from '../../lib/websocket';

const createPageWithBlocks = new Hono<{ Bindings: Env }>();

/**
 * POST /api/flows/createPageWithBlocks
 * Creates a page and optionally appends content blocks in a single atomic operation
 */
createPageWithBlocks.post('/', async (c) => {
  const flowRunId = await createFlowRun(c.env, 'createPageWithBlocks');
  c.executionCtx?.waitUntil(
    sendFlowUpdate(c.env, flowRunId, {
      type: 'flow_started',
      flow: 'createPageWithBlocks',
    })
  );

  try {
    const body = await c.req.json();
    const validated = CreatePageWithBlocksSchema.parse(body);

    const notion = createNotionClient(validated.notion_token);

    // Build page properties with title
    const properties: any = {
      title: {
        title: [
          {
            text: {
              content: validated.title,
            },
          },
        ],
      },
      ...validated.properties,
    };

    // Create the page
    const page = await notion.pages.create({
      parent: validated.parent as any,
      properties,
      icon: validated.icon,
      cover: validated.cover,
    });

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'page_created',
        flow: 'createPageWithBlocks',
        pageId: page.id,
      })
    );

    // If blocks are provided, append them to the page
    let appendedBlocks = null;
    if (validated.blocks && validated.blocks.length > 0) {
      appendedBlocks = await notion.blocks.children.append({
        block_id: page.id,
        children: validated.blocks as any,
      });

      c.executionCtx?.waitUntil(
        sendFlowUpdate(c.env, flowRunId, {
          type: 'blocks_appended',
          flow: 'createPageWithBlocks',
          pageId: page.id,
          blockCount: validated.blocks.length,
        })
      );
    }

    const result = {
      flowRunId,
      page,
      blocks: appendedBlocks,
    };

    await updateFlowRun(c.env, flowRunId, 'completed', JSON.stringify(result));
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_completed',
        flow: 'createPageWithBlocks',
        pageId: result.page.id,
      })
    );

    return c.json(successResponse(result));
  } catch (error: any) {
    await updateFlowRun(c.env, flowRunId, 'failed', undefined, error.message);
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_failed',
        flow: 'createPageWithBlocks',
        error: error.message,
      })
    );
    return c.json(errorResponse(error.message || 'Flow failed'), 500);
  }
});

export default createPageWithBlocks;
