import type { DurableObjectState } from '@cloudflare/workers-types';
import type { Env } from '../utils/types';

interface FlowBroadcastMessage {
  type: string;
  [key: string]: unknown;
}

/**
 * Durable Object that tracks active flow sessions and broadcasts updates
 */
export class FlowMonitorDO {
  private readonly ctx: DurableObjectState;

  private readonly sessions = new Set<WebSocket>();

  constructor(state: DurableObjectState, _env: Env) {
    this.ctx = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);
      this.sessions.add(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (request.method === 'POST' && url.pathname.endsWith('/update')) {
      try {
        const message = (await request.json()) as FlowBroadcastMessage;
        await this.broadcast(message);
        return new Response(null, { status: 202 });
      } catch (error) {
        console.error('FlowMonitorDO update error:', error);
        return new Response('Invalid broadcast payload', { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: MessageEvent): Promise<void> {
    try {
      if (typeof message.data === 'string') {
        const parsed = JSON.parse(message.data);
        await this.broadcast(parsed);
      }
    } catch (error) {
      console.error('FlowMonitorDO message error:', error);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('FlowMonitorDO socket error:', error);
    this.sessions.delete(ws);
  }

  private async broadcast(message: FlowBroadcastMessage): Promise<void> {
    const payload = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString(),
    });

    const removals: WebSocket[] = [];

    for (const session of this.sessions) {
      try {
        session.send(payload);
      } catch (error) {
        console.error('FlowMonitorDO broadcast error:', error);
        removals.push(session);
      }
    }

    for (const socket of removals) {
      this.sessions.delete(socket);
    }
  }
}
