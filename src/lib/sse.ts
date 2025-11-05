import type { Context } from 'hono';
import type { Env } from '../utils/types';

const encoder = new TextEncoder();

function encodeEvent(event: string, data: any): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function streamFlowUpdates(
  c: Context<{ Bindings: Env }>,
  flowId: string
): Response {
  const stub = c.env.FLOW_MONITOR.get(c.env.FLOW_MONITOR.idFromName(flowId));
  let upstream: WebSocket | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encodeEvent('connected', { flowId }));

      try {
        const response = await stub.fetch('https://flow-monitor', {
          headers: {
            Upgrade: 'websocket',
          },
        });

        const socket = response.webSocket;
        if (!socket) {
          throw new Error('Flow monitor upgrade failed');
        }

        upstream = socket;
        upstream.accept();

        upstream.addEventListener('message', (event) => {
          try {
            const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            controller.enqueue(encodeEvent('message', payload));
          } catch (error) {
            console.error('Failed to decode flow event:', error);
          }
        });

        upstream.addEventListener('close', () => {
          controller.close();
        });

        upstream.addEventListener('error', (error) => {
          console.error('SSE upstream error:', error);
          controller.error(error);
        });
      } catch (error) {
        console.error('Failed to stream flow updates:', error);
        controller.error(error);
      }
    },
    cancel() {
      upstream?.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
