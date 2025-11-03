/**
 * OpenAPI specification generator
 * Creates dynamic OpenAPI 3.1.0 spec for all endpoints
 */

import { OpenApiBuilder, SchemaObject } from 'openapi3-ts/oas31';

/**
 * Generate OpenAPI 3.1.0 specification
 * Optimized for ChatGPT Custom Actions
 */
export function generateOpenAPISpec(): any {
  const builder = new OpenApiBuilder()
    .addInfo({
      title: 'Notion Proxy API',
      version: '1.0.0',
      description: 'Cloudflare Worker proxy and orchestration layer for the Notion SDK. Provides REST endpoints for Notion API operations and high-level workflow orchestration.',
    })
    .addServer({
      url: '/',
      description: 'Default server',
    })
    .addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'API Key',
      description: 'API key from WORKER_API_KEY environment variable',
    });

  // Health endpoint
  builder.addPath('/health', {
    get: {
      summary: 'Health check',
      description: 'Returns worker status and uptime',
      responses: {
        '200': {
          description: 'Health status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      uptime: { type: 'number', description: 'Uptime in seconds' },
                      timestamp: { type: 'string', format: 'date-time' },
                      environment: { type: 'string', example: 'production' },
                    },
                  },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  });

  // Monitor endpoint
  builder.addPath('/monitor', {
    get: {
      summary: 'Get monitoring data',
      description: 'Returns recent request logs and flow runs',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of records to return',
          schema: { type: 'integer', default: 50 },
        },
      ],
      responses: {
        '200': {
          description: 'Monitoring data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      logs: { type: 'array', items: { type: 'object' } },
                      flowRuns: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  });

  // Raw API - Pages
  builder.addPath('/api/raw/pages/{page_id}', {
    get: {
      summary: 'Retrieve a page',
      description: 'Get a Notion page by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page_id',
          in: 'path',
          required: true,
          description: 'The ID of the page to retrieve',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Page data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Page not found' },
      },
    },
  });

  builder.addPath('/api/raw/pages', {
    post: {
      summary: 'Create a page',
      description: 'Create a new Notion page',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['parent', 'properties'],
              properties: {
                parent: {
                  type: 'object',
                  description: 'Parent database or page',
                },
                properties: {
                  type: 'object',
                  description: 'Page properties',
                },
                children: {
                  type: 'array',
                  description: 'Child blocks',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Created page' },
        '401': { description: 'Unauthorized' },
      },
    },
  });

  // Databases
  builder.addPath('/api/raw/databases/{database_id}/query', {
    post: {
      summary: 'Query a database',
      description: 'Query a Notion database with filters and sorts',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'database_id',
          in: 'path',
          required: true,
          description: 'The ID of the database to query',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                filter: { type: 'object', description: 'Filter criteria' },
                sorts: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'Sort criteria',
                },
                page_size: { type: 'integer', minimum: 1, maximum: 100 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Query results' },
        '401': { description: 'Unauthorized' },
      },
    },
  });

  // Search
  builder.addPath('/api/raw/search', {
    post: {
      summary: 'Search pages and databases',
      description: 'Search all pages and databases',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                filter: {
                  type: 'object',
                  properties: {
                    value: { type: 'string', enum: ['page', 'database'] },
                    property: { type: 'string', enum: ['object'] },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Search results' },
        '401': { description: 'Unauthorized' },
      },
    },
  });

  // Flows
  builder.addPath('/api/flows/createPageWithBlocks', {
    post: {
      summary: 'Create page with blocks',
      description: 'Orchestrated flow to create a page with title and content blocks in a single operation',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['notion_token', 'parent', 'title'],
              properties: {
                notion_token: { type: 'string', description: 'Notion API token' },
                parent: {
                  type: 'object',
                  description: 'Parent database or page',
                },
                title: { type: 'string', description: 'Page title' },
                properties: { type: 'object', description: 'Additional properties' },
                blocks: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'Content blocks',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Created page with blocks' },
        '401': { description: 'Unauthorized' },
      },
    },
  });

  return builder.getSpec();
}
