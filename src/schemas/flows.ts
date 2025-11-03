/**
 * Zod schemas for flow orchestration endpoints
 * Defines validation schemas for high-level workflow operations
 */

import { z } from 'zod';

/**
 * Schema for creating a page with blocks in a single operation
 */
export const CreatePageWithBlocksSchema = z.object({
  notion_token: z.string().describe('Notion API integration token'),
  parent: z.object({
    database_id: z.string().optional(),
    page_id: z.string().optional(),
  }).describe('Parent database or page'),
  title: z.string().describe('Page title'),
  properties: z.record(z.any()).optional().describe('Additional page properties'),
  blocks: z.array(z.any()).optional().describe('Content blocks to add'),
  icon: z.any().optional().describe('Page icon'),
  cover: z.any().optional().describe('Page cover image'),
});

/**
 * Schema for cloning a database schema
 */
export const CloneDatabaseSchemaSchema = z.object({
  notion_token: z.string().describe('Notion API integration token'),
  source_database_id: z.string().describe('Database ID to clone from'),
  parent: z.object({
    page_id: z.string(),
  }).describe('Parent page for the new database'),
  title: z.string().describe('Title for the new database'),
});

/**
 * Schema for searching and tagging pages
 */
export const SearchAndTagSchema = z.object({
  notion_token: z.string().describe('Notion API integration token'),
  query: z.string().describe('Search query'),
  property_name: z.string().describe('Property name to update'),
  property_value: z.any().describe('Value to set for the property'),
  filter: z.object({
    value: z.enum(['page', 'database']).optional(),
    property: z.literal('object').optional(),
  }).optional().describe('Filter by object type'),
});
