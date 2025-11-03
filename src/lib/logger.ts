/**
 * Database logger for request and flow tracking
 * Handles logging to D1 database
 */

import type { Env, RequestLog, FlowRun } from '../utils/types';

/**
 * Log an API request to the database
 * @param env - Cloudflare Worker environment
 * @param log - Request log data
 */
export async function logRequest(
  env: Env,
  log: Omit<RequestLog, 'id' | 'timestamp'>
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO request_logs (path, method, status, user_agent, duration_ms)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(log.path, log.method, log.status, log.user_agent, log.duration_ms)
      .run();
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

/**
 * Create a new flow run record
 * @param env - Cloudflare Worker environment
 * @param flow_name - Name of the flow
 * @param input_data - Input parameters as JSON string
 * @returns Flow run ID
 */
export async function createFlowRun(
  env: Env,
  flow_name: string,
  input_data?: string
): Promise<number> {
  const result = await env.DB.prepare(
    `INSERT INTO flow_runs (flow_name, status, input_data)
     VALUES (?, 'running', ?)
     RETURNING id`
  )
    .bind(flow_name, input_data)
    .first<{ id: number }>();

  return result?.id || 0;
}

/**
 * Update a flow run with completion status
 * @param env - Cloudflare Worker environment
 * @param id - Flow run ID
 * @param status - Final status
 * @param output_data - Output data as JSON string
 * @param error_message - Error message if failed
 */
export async function updateFlowRun(
  env: Env,
  id: number,
  status: 'completed' | 'failed',
  output_data?: string,
  error_message?: string
): Promise<void> {
  await env.DB.prepare(
    `UPDATE flow_runs
     SET status = ?, output_data = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(status, output_data, error_message, id)
    .run();
}

/**
 * Get recent request logs
 * @param env - Cloudflare Worker environment
 * @param limit - Maximum number of records to return
 * @returns Array of request logs
 */
export async function getRecentLogs(
  env: Env,
  limit: number = 100
): Promise<RequestLog[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT ?`
  )
    .bind(limit)
    .all<RequestLog>();

  return result.results || [];
}

/**
 * Get recent flow runs
 * @param env - Cloudflare Worker environment
 * @param limit - Maximum number of records to return
 * @returns Array of flow runs
 */
export async function getRecentFlowRuns(
  env: Env,
  limit: number = 100
): Promise<FlowRun[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM flow_runs ORDER BY started_at DESC LIMIT ?`
  )
    .bind(limit)
    .all<FlowRun>();

  return result.results || [];
}
