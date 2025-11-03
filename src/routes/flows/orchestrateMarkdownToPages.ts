import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../../utils/types';
import { successResponse, errorResponse } from '../../utils/response';
import { createFlowRun, updateFlowRun } from '../../lib/logger';
import { createNotionClient } from '../../lib/notion';
import { sendFlowUpdate } from '../../lib/websocket';
import { OrchestrateMarkdownToPagesSchema } from '../../schemas/flows';

const orchestrate = new Hono<{ Bindings: Env }>();

const MarkdownPlanSchema = z.array(
  z.object({
    title: z.string(),
    content: z.string(),
  })
);

const NotionBlocksSchema = z.array(z.record(z.any()));

function extractAiText(result: any): string {
  if (!result) {
    return '';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (typeof result.response === 'string') {
    return result.response;
  }

  if (Array.isArray(result.output)) {
    const content = result.output
      .flatMap((item: any) => item?.content ?? [])
      .map((entry: any) => entry?.text ?? entry?.data?.[0]?.text)
      .filter((value: any) => typeof value === 'string')
      .join('\n');
    if (content) {
      return content;
    }
  }

  if (Array.isArray(result.messages)) {
    const last = result.messages[result.messages.length - 1];
    if (last && typeof last.content === 'string') {
      return last.content;
    }
  }

  return JSON.stringify(result);
}

function normalizeJsonOutput(output: string): string {
  let trimmed = output.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\w*\s*/i, '')
      .replace(/```\s*$/i, '');
  }
  return trimmed.trim();
}

function parseJsonWithSchema<T>(text: string, schema: z.ZodType<T>, context: string): T {
  try {
    const parsed = JSON.parse(text);
    return schema.parse(parsed);
  } catch (error: any) {
    throw new Error(`${context}: ${error.message || error}`);
  }
}

orchestrate.post('/', async (c) => {
  const rawBody = await c.req.json();
  const flowRunId = await createFlowRun(
    c.env,
    'orchestrateMarkdownToPages',
    JSON.stringify(rawBody)
  );

  try {
    const validated = OrchestrateMarkdownToPagesSchema.parse(rawBody);

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_started',
        flow: 'orchestrateMarkdownToPages',
      })
    );

    const plannerResult = await c.env.AI.run(validated.ai_model as any, {
      messages: [
        {
          role: 'system',
          content:
            'You are a content planner. Analyze the following markdown. Identify all logical pages (e.g., separated by <h1> or ---). For each page, extract its title and its full markdown content. Output a JSON array of {"title": string, "content": string}.',
        },
        {
          role: 'user',
          content: validated.markdown_content,
        },
      ],
    });

    const plannerText = normalizeJsonOutput(extractAiText(plannerResult));
    const plan = parseJsonWithSchema(plannerText, MarkdownPlanSchema, 'Failed to parse AI planning response');

    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'planning_completed',
        flow: 'orchestrateMarkdownToPages',
        pageCount: plan.length,
      })
    );

    const notion = createNotionClient(validated.notion_token);
    const pagesCreated: Array<{ pageId: string; title: string }> = [];

    for (const pagePlan of plan) {
      c.executionCtx?.waitUntil(
        sendFlowUpdate(c.env, flowRunId, {
          type: 'page_creation_started',
          flow: 'orchestrateMarkdownToPages',
          title: pagePlan.title,
        })
      );

      const page = await notion.pages.create({
        parent: { page_id: validated.base_parent_page_id } as any,
        properties: {
          title: {
            title: [
              {
                text: {
                  content: pagePlan.title,
                },
              },
            ],
          },
        },
      });

      pagesCreated.push({ pageId: page.id, title: pagePlan.title });

      c.executionCtx?.waitUntil(
        sendFlowUpdate(c.env, flowRunId, {
          type: 'page_created',
          flow: 'orchestrateMarkdownToPages',
          pageId: page.id,
          title: pagePlan.title,
        })
      );

      c.executionCtx?.waitUntil(
        sendFlowUpdate(c.env, flowRunId, {
          type: 'block_conversion_started',
          flow: 'orchestrateMarkdownToPages',
          pageId: page.id,
        })
      );

      const blockResult = await c.env.AI.run(validated.ai_model as any, {
        messages: [
          {
            role: 'system',
            content:
              'You are a markdown-to-Notion converter. Convert the following markdown text into a valid JSON array of Notion API block objects. Use standard block types (heading_1, heading_2, paragraph, bulleted_list_item, etc.). Respond ONLY with the JSON array.',
          },
          {
            role: 'user',
            content: pagePlan.content,
          },
        ],
      });

      const blocksText = normalizeJsonOutput(extractAiText(blockResult));
      const blocks = parseJsonWithSchema(
        blocksText,
        NotionBlocksSchema,
        'Failed to parse AI block response'
      );

      if (blocks.length > 0) {
        await notion.blocks.children.append({
          block_id: page.id,
          children: blocks as any,
        });
      }

      c.executionCtx?.waitUntil(
        sendFlowUpdate(c.env, flowRunId, {
          type: 'blocks_appended',
          flow: 'orchestrateMarkdownToPages',
          pageId: page.id,
          blockCount: blocks.length,
        })
      );
    }

    const summary = {
      flowRunId,
      createdPages: pagesCreated,
    };

    await updateFlowRun(c.env, flowRunId, 'completed', JSON.stringify(summary));
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_completed',
        flow: 'orchestrateMarkdownToPages',
        createdCount: pagesCreated.length,
      })
    );

    return c.json(successResponse(summary));
  } catch (error: any) {
    await updateFlowRun(c.env, flowRunId, 'failed', undefined, error.message);
    c.executionCtx?.waitUntil(
      sendFlowUpdate(c.env, flowRunId, {
        type: 'flow_failed',
        flow: 'orchestrateMarkdownToPages',
        error: error.message,
      })
    );
    return c.json(errorResponse(error.message || 'Flow failed'), 500);
  }
});

export default orchestrate;
