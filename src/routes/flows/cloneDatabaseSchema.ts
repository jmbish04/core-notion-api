/**
 * Flow: Clone Database Schema
 * Orchestrated operation to duplicate a database schema to another workspace
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createNotionClient } from '../../lib/notion';
import { createFlowRun, updateFlowRun } from '../../lib/logger';
import { CloneDatabaseSchemaSchema } from '../../schemas/flows';
import { sendFlowUpdate } from '../../lib/websocket';

const cloneDatabaseSchema = new Hono<{ Bindings: Env }>();

/**
 * POST /api/flows/cloneDatabaseSchema
 * Reads a database schema and creates a new database with the same structure
 */
cloneDatabaseSchema.post('/', async (c) => {
  const flowRunId = await createFlowRun(c.env, 'cloneDatabaseSchema');

  try {
    const body = await c.req.json();
    const validated = CloneDatabaseSchemaSchema.parse(body);

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_started',
        flow: 'cloneDatabaseSchema',
        sourceDatabaseId: validated.source_database_id,
      })
    );

    const notion = createNotionClient(validated.notion_token);

    // Retrieve the source database to get its schema
    const sourceDb = await notion.databases.retrieve({
      database_id: validated.source_database_id,
    });

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'source_database_retrieved',
        flow: 'cloneDatabaseSchema',
        sourceDatabaseId: validated.source_database_id,
      })
    );

    // Create a new database with the same properties, removing IDs from the property definitions.
    const createProperties = Object.fromEntries(
      Object.entries((sourceDb as any).properties).map(([name, prop]: [string, any]) => {
        const { id, ...rest } = prop;
        return [name, rest];
      })
    ) as Record<string, any>;

    const newDb = await (notion.databases as any).create({
      parent: validated.parent as any,
      title: [
        {
          text: {
            content: validated.title,
          },
        },
      ],
      properties: createProperties,
    });

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'database_created',
        flow: 'cloneDatabaseSchema',
        databaseId: (newDb as any).id,
      })
    );

    const result = {
      flowRunId,
      source_database: sourceDb,
      new_database: newDb,
    };

    await updateFlowRun(c.env, flowRunId, 'completed', JSON.stringify(result));
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_completed',
        flow: 'cloneDatabaseSchema',
        databaseId: (newDb as any).id,
      })
    );

    return c.json(successResponse(result));
  } catch (error: any) {
    await updateFlowRun(c.env, flowRunId, 'failed', undefined, error.message);
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_failed',
        flow: 'cloneDatabaseSchema',
        error: error.message,
      })
    );
    return c.json(errorResponse(error.message || 'Flow failed'), 500);
  }
});

export default cloneDatabaseSchema;
