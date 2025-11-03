/**
 * Server-Sent Events (SSE) utilities for MCP protocol
 * Provides streaming event interface for flow updates
 */

import type { Context } from 'hono';

/**
 * Create an SSE response stream
 * @param c - Hono context
 * @param eventGenerator - Async generator that yields events
 */
export function createSSEStream(
  c: Context,
  eventGenerator: AsyncGenerator<any>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of eventGenerator) {
          const data = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.close();
      } catch (error) {
        console.error('SSE stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Format an event for SSE transmission
 * @param eventType - Event type
 * @param data - Event data
 */
export function formatSSEEvent(eventType: string, data: any): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}
