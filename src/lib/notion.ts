/**
 * Notion SDK client wrapper
 * Provides a configured Notion client instance
 */

import { Client } from '@notionhq/client';

/**
 * Create a Notion client instance with the provided API token
 * @param token - Notion API integration token
 * @returns Configured Notion client
 */
export function createNotionClient(token: string): Client {
  return new Client({
    auth: token,
  });
}
