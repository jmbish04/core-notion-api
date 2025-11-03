import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  CreatePageSchema,
  UpdatePageSchema,
  QueryDatabaseSchema,
  AppendBlocksSchema,
  SearchSchema,
} from '../schemas/raw';
import {
  CreatePageWithBlocksSchema,
  CloneDatabaseSchemaSchema,
  SearchAndTagSchema,
  OrchestrateMarkdownToPagesSchema,
} from '../schemas/flows';

const HealthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.string(),
    uptime: z.number(),
    timestamp: z.string(),
    environment: z.string().optional(),
  }),
  timestamp: z.string(),
});

const MonitorResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    logs: z.array(z.record(z.any())),
    flowRuns: z.array(z.record(z.any())),
  }),
  timestamp: z.string(),
});

const GenericSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  timestamp: z.string(),
});

const FlowResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export function generateOpenAPISpec() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'API Key',
    description: 'Set Authorization: Bearer <WORKER_API_KEY>.',
  });

  const NotionTokenHeader = registry.register(
    'NotionTokenHeader',
    z.object({ 'x-notion-token': z.string().describe('Notion integration token') })
  );
  const GetPageParams = registry.register('GetPageParams', z.object({ page_id: z.string() }));
  const GetDatabaseParams = registry.register('GetDatabaseParams', z.object({ database_id: z.string() }));
  const GetBlockParams = registry.register('GetBlockParams', z.object({ block_id: z.string() }));
  const FlowStreamParams = registry.register('FlowStreamParams', z.object({ flowId: z.string() }));

  const CreatePageRequest = registry.register('CreatePageRequest', CreatePageSchema);
  const UpdatePageRequest = registry.register('UpdatePageRequest', UpdatePageSchema);
  const QueryDatabaseRequest = registry.register('QueryDatabaseRequest', QueryDatabaseSchema);
  const AppendBlocksRequest = registry.register('AppendBlocksRequest', AppendBlocksSchema);
  const SearchRequest = registry.register('SearchRequest', SearchSchema);
  const CreatePageWithBlocksRequest = registry.register(
    'CreatePageWithBlocksRequest',
    CreatePageWithBlocksSchema
  );
  const CloneDatabaseRequest = registry.register('CloneDatabaseSchemaRequest', CloneDatabaseSchemaSchema);
  const SearchAndTagRequest = registry.register('SearchAndTagRequest', SearchAndTagSchema);
  const OrchestrateMarkdownRequest = registry.register(
    'OrchestrateMarkdownToPagesRequest',
    OrchestrateMarkdownToPagesSchema
  );

  const HealthResponse = registry.register('HealthResponse', HealthResponseSchema);
  const MonitorResponse = registry.register('MonitorResponse', MonitorResponseSchema);
  const GenericSuccess = registry.register('GenericSuccess', GenericSuccessSchema);
  const FlowResponse = registry.register('FlowResponse', FlowResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/health',
    summary: 'Health check',
    description: 'Returns worker status and uptime.',
    responses: {
      200: {
        description: 'Health status',
        content: {
          'application/json': {
            schema: HealthResponse,
          },
        },
      },
    },
    security: [],
  });

  registry.registerPath({
    method: 'get',
    path: '/monitor',
    summary: 'Get monitoring data',
    description: 'Returns recent request logs and flow runs.',
    responses: {
      200: {
        description: 'Monitoring payload',
        content: {
          'application/json': {
            schema: MonitorResponse,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/api/raw/pages/{page_id}',
    summary: 'Retrieve a Notion page',
    request: {
      params: GetPageParams,
      headers: NotionTokenHeader,
    },
    responses: {
      200: {
        description: 'Page data',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/raw/pages',
    summary: 'Create a Notion page',
    request: {
      headers: NotionTokenHeader,
      body: {
        content: {
          'application/json': {
            schema: CreatePageRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Created page',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/raw/pages/{page_id}',
    summary: 'Update a Notion page',
    request: {
      params: GetPageParams,
      headers: NotionTokenHeader,
      body: {
        content: {
          'application/json': {
            schema: UpdatePageRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated page',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/api/raw/databases/{database_id}',
    summary: 'Retrieve a database',
    request: {
      params: GetDatabaseParams,
      headers: NotionTokenHeader,
    },
    responses: {
      200: {
        description: 'Database data',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/raw/databases/{database_id}/query',
    summary: 'Query a database',
    request: {
      params: GetDatabaseParams,
      headers: NotionTokenHeader,
      body: {
        content: {
          'application/json': {
            schema: QueryDatabaseRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Query results',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/api/raw/blocks/{block_id}',
    summary: 'Retrieve a block',
    request: {
      params: GetBlockParams,
      headers: NotionTokenHeader,
    },
    responses: {
      200: {
        description: 'Block data',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/api/raw/blocks/{block_id}/children',
    summary: 'Retrieve block children',
    request: {
      params: GetBlockParams,
      headers: NotionTokenHeader,
    },
    responses: {
      200: {
        description: 'Children list',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/raw/blocks/{block_id}/children',
    summary: 'Append blocks to a parent',
    request: {
      params: GetBlockParams,
      headers: NotionTokenHeader,
      body: {
        content: {
          'application/json': {
            schema: AppendBlocksRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Append result',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/raw/search',
    summary: 'Search Notion content',
    request: {
      headers: NotionTokenHeader,
      body: {
        content: {
          'application/json': {
            schema: SearchRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Search results',
        content: {
          'application/json': {
            schema: GenericSuccess,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/flows/createPageWithBlocks',
    summary: 'Create a page with optional blocks',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePageWithBlocksRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Flow result',
        content: {
          'application/json': {
            schema: FlowResponse,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/flows/cloneDatabaseSchema',
    summary: 'Clone a database schema into a new database',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CloneDatabaseRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Flow result',
        content: {
          'application/json': {
            schema: FlowResponse,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/flows/searchAndTag',
    summary: 'Search pages and apply a property update',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SearchAndTagRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Flow result',
        content: {
          'application/json': {
            schema: FlowResponse,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/api/flows/orchestrateMarkdownToPages',
    summary: 'Convert markdown into structured Notion pages using Workers AI',
    request: {
      body: {
        content: {
          'application/json': {
            schema: OrchestrateMarkdownRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Flow result',
        content: {
          'application/json': {
            schema: FlowResponse,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/mcp/stream/{flowId}',
    summary: 'Server-Sent Events stream for flow updates',
    description: 'Streams flow updates as SSE events. Authorization can be sent via header or apiKey query parameter.',
    request: {
      params: FlowStreamParams,
    },
    responses: {
      200: {
        description: 'SSE stream',
        content: {
          'text/event-stream': {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Notion Proxy API',
      version: '1.0.0',
      description:
        'Cloudflare Worker proxy and orchestration layer for the Notion SDK. Includes raw Notion operations and AI-assisted flows.',
    },
    servers: [{ url: '/' }],
    security: [{ bearerAuth: [] }],
  });
}
