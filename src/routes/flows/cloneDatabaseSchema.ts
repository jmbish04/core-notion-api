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

    const notion = createNotionClient(validated.notion_token);

    // Retrieve the source database to get its schema
    const sourceDb = await notion.databases.retrieve({
      database_id: validated.source_database_id,
    });

    // Create a new database with the same properties
    const newDb = await notion.databases.create({
      parent: validated.parent as any,
      title: [
        {
          text: {
            content: validated.title,
          },
        },
      ],
      properties: (sourceDb as any).properties,
    });

    const result = {
      source_database: sourceDb,
      new_database: newDb,
    };

    await updateFlowRun(c.env, flowRunId, 'completed', JSON.stringify(result));

    return c.json(successResponse(result));
  } catch (error: any) {
    await updateFlowRun(c.env, flowRunId, 'failed', undefined, error.message);
    return c.json(errorResponse(error.message || 'Flow failed'), 500);
  }
});

export default cloneDatabaseSchema;
