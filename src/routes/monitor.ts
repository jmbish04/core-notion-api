/**
 * Monitor endpoint
 * Provides visibility into request logs and flow runs
 */

import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { successResponse } from '../utils/response';
import { getRecentLogs, getRecentFlowRuns } from '../lib/logger';

const monitor = new Hono<{ Bindings: Env }>();

/**
 * GET /monitor
 * Returns recent request logs and flow runs
 */
monitor.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10);

  const [logs, flowRuns] = await Promise.all([
    getRecentLogs(c.env, limit),
    getRecentFlowRuns(c.env, limit),
  ]);

  return c.json(
    successResponse({
      logs,
      flowRuns,
      timestamp: new Date().toISOString(),
    })
  );
});

/**
 * GET /monitor/logs
 * Returns only request logs
 */
monitor.get('/logs', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const logs = await getRecentLogs(c.env, limit);

  return c.json(successResponse(logs));
});

/**
 * GET /monitor/flows
 * Returns only flow runs
 */
monitor.get('/flows', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const flowRuns = await getRecentFlowRuns(c.env, limit);

  return c.json(successResponse(flowRuns));
});

export default monitor;
