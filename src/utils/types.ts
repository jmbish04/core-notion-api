/**
 * Type definitions for the Notion Proxy Worker
 * Defines Cloudflare Worker environment bindings and shared types
 */

import type { Ai, DurableObjectNamespace } from '@cloudflare/workers-types';

/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  /** Worker API key for authentication */
  WORKER_API_KEY: string;
  /** D1 database binding for request logs and flow tracking */
  DB: D1Database;
  /** Assets binding for serving static files */
  ASSETS: Fetcher;
  /** Workers AI binding */
  AI: Ai;
  /** Durable Object namespace for flow monitoring */
  FLOW_MONITOR: DurableObjectNamespace;
  /** Environment mode */
  NODE_ENV?: string;
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Flow execution status
 */
export type FlowStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Flow run record
 */
export interface FlowRun {
  id: number;
  flow_name: string;
  status: FlowStatus;
  input_data?: string;
  output_data?: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

/**
 * Request log record
 */
export interface RequestLog {
  id: number;
  path: string;
  method: string;
  status: number;
  user_agent?: string;
  timestamp: string;
  duration_ms?: number;
}
