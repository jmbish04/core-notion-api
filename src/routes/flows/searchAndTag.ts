/**
 * Flow: Search and Tag
 * Orchestrated operation to search pages and apply tags/properties in bulk
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { createFlowRun, updateFlowRun } from '../../lib/logger';
import { SearchAndTagSchema } from '../../schemas/flows';
import { sendFlowUpdate } from '../../lib/websocket';

const searchAndTag = new Hono<{ Bindings: Env }>();

/**
 * POST /api/flows/searchAndTag
 * Searches for pages matching a query and updates a property on all results
 */
searchAndTag.post('/', async (c) => {
  const flowRunId = await createFlowRun(c.env, 'searchAndTag');

  try {
    const body = await c.req.json();
    const validated = SearchAndTagSchema.parse(body);

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_started',
        flow: 'searchAndTag',
        query: validated.query,
      })
    );

    const notion = createNotionClient(validated.notion_token);

    // Search for matching pages
    const searchResults = await notion.search({
      query: validated.query,
      filter: validated.filter as any,
    });

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'search_completed',
        flow: 'searchAndTag',
        resultCount: searchResults.results.length,
      })
    );

    // Update each result with the specified property
    const updatedPages = [];
    for (const item of searchResults.results) {
      if (item.object === 'page') {
        try {
          const updated = await notion.pages.update({
            page_id: item.id,
            properties: {
              [validated.property_name]: validated.property_value,
            },
          });
          updatedPages.push(updated);
          c.executionCtx?.waitUntil(
            sendFlowUpdate(c.env, flowRunId, {
              type: 'page_updated',
              flow: 'searchAndTag',
              pageId: item.id,
            })
          );
        } catch (error: any) {
          console.error(`Failed to update page ${item.id}:`, error.message);
          c.executionCtx?.waitUntil(
            sendFlowUpdate(c.env, flowRunId, {
              type: 'page_update_failed',
              flow: 'searchAndTag',
              pageId: item.id,
              error: error.message,
            })
          );
          // Continue with other pages even if one fails
        }
      }
    }

    const result = {
      flowRunId,
      search_results: searchResults,
      updated_count: updatedPages.length,
      updated_pages: updatedPages,
    };

    await updateFlowRun(c.env, flowRunId, 'completed', JSON.stringify(result));
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_completed',
        flow: 'searchAndTag',
        updatedCount: updatedPages.length,
      })
    );

    return c.json(successResponse(result));
  } catch (error: any) {
    await updateFlowRun(c.env, flowRunId, 'failed', undefined, error.message);
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_failed',
        flow: 'searchAndTag',
        error: error.message,
      })
    );
    return c.json(errorResponse(error.message || 'Flow failed'), 500);
  }
});

export default searchAndTag;
