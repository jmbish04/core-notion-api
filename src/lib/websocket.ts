import type { Env } from '../utils/types';

export interface FlowUpdateMessage extends Record<string, unknown> {
  type: string;
  flowRunId: string;
}

function getFlowMonitorStub(env: Env, flowRunId: string) {
  const id = env.FLOW_MONITOR.idFromName(flowRunId);
  return env.FLOW_MONITOR.get(id);
}

export async function sendFlowUpdate(
  env: Env,
  flowRunId: number | string,
  message: Omit<FlowUpdateMessage, 'flowRunId'>
): Promise<void> {
  const flowRunKey = String(flowRunId);
  const stub = getFlowMonitorStub(env, flowRunKey);
  const payload: FlowUpdateMessage = {
    flowRunId: flowRunKey,
    ...message,
  } as FlowUpdateMessage;

  try {
    await stub.fetch('https://flow-monitor/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send flow update:', error);
  }
}
