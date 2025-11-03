/**
 * Zod schemas for raw API proxy endpoints
 * Defines validation schemas for Notion SDK operations
 */

import { z } from 'zod';

/**
 * Schema for retrieving a page by ID
 */
export const GetPageSchema = z.object({
  page_id: z.string().describe('The ID of the page to retrieve'),
});

/**
 * Schema for querying a database
 */
export const QueryDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to query'),
  filter: z.any().optional().describe('Filter object for the query'),
  sorts: z.array(z.any()).optional().describe('Sort criteria'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().min(1).max(100).optional().describe('Number of results per page'),
});

/**
 * Schema for creating a page
 */
export const CreatePageSchema = z.object({
  parent: z.object({
    database_id: z.string().optional(),
    page_id: z.string().optional(),
  }).describe('Parent database or page'),
  properties: z.record(z.any()).describe('Page properties'),
  children: z.array(z.any()).optional().describe('Child blocks'),
  icon: z.any().optional().describe('Page icon'),
  cover: z.any().optional().describe('Page cover image'),
});

/**
 * Schema for updating a page
 */
export const UpdatePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to update'),
  properties: z.record(z.any()).optional().describe('Page properties to update'),
  archived: z.boolean().optional().describe('Whether to archive the page'),
  icon: z.any().optional().describe('Page icon'),
  cover: z.any().optional().describe('Page cover image'),
});

/**
 * Schema for retrieving a block
 */
export const GetBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to retrieve'),
});

/**
 * Schema for appending blocks to a parent
 */
export const AppendBlocksSchema = z.object({
  block_id: z.string().describe('The ID of the parent block'),
  children: z.array(z.any()).describe('Child blocks to append'),
});

/**
 * Schema for searching pages/databases
 */
export const SearchSchema = z.object({
  query: z.string().optional().describe('Search query string'),
  filter: z.object({
    value: z.enum(['page', 'database']).optional(),
    property: z.literal('object').optional(),
  }).optional().describe('Filter by object type'),
  sort: z.object({
    direction: z.enum(['ascending', 'descending']),
    timestamp: z.enum(['last_edited_time']),
  }).optional().describe('Sort criteria'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().min(1).max(100).optional().describe('Number of results per page'),
});
