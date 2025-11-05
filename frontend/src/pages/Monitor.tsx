import { useState } from 'react';
import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useApiContext } from '../context/ApiContext';
import { useWorkerClient } from '../hooks/useWorkerClient';

interface MonitorResponse {
  success: boolean;
  data: {
    logs: Array<Record<string, any>>;
    flowRuns: Array<Record<string, any>>;
  };
  timestamp: string;
}

export function MonitorPage() {
  const { apiKey, setApiKey } = useApiContext();
  const client = useWorkerClient();
  const [limit, setLimit] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MonitorResponse | null>(null);

  const fetchMonitor = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({ limit: String(limit) });
      const response = (await client(`/monitor?${query.toString()}`)) as MonitorResponse;
      setPayload(response);
    } catch (err: any) {
      setError(err.message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Paper withBorder p="lg" radius="md">
        <Stack gap="sm">
          <Title order={3}>Worker API Access</Title>
          <TextInput
            label="WORKER_API_KEY"
            placeholder="Enter the Worker API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.currentTarget.value)}
          />
          <Group align="flex-end">
            <NumberInput
              label="Result limit"
              min={1}
              max={200}
              value={limit}
              onChange={(value) => setLimit(Number(value) || 25)}
            />
            <Button onClick={fetchMonitor} loading={loading} disabled={!apiKey}>
              Fetch monitor data
            </Button>
          </Group>
          {error && (
            <Text c="red.4" size="sm">
              {error}
            </Text>
          )}
        </Stack>
      </Paper>

      {payload && (
        <Stack gap="lg">
          <Paper withBorder p="lg" radius="md">
            <Title order={4}>Recent Requests</Title>
            <Table striped withRowBorders={false} mt="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Method</Table.Th>
                  <Table.Th>Path</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Timestamp</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payload.data.logs.map((log, index) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>{log.method}</Table.Td>
                    <Table.Td>{log.path}</Table.Td>
                    <Table.Td>{log.status}</Table.Td>
                    <Table.Td>{log.duration_ms ?? '—'} ms</Table.Td>
                    <Table.Td>{log.timestamp}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <Paper withBorder p="lg" radius="md">
            <Title order={4}>Recent Flow Runs</Title>
            <Table striped withRowBorders={false} mt="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Flow</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Started</Table.Th>
                  <Table.Th>Completed</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payload.data.flowRuns.map((flow) => (
                  <Table.Tr key={flow.id}>
                    <Table.Td>{flow.id}</Table.Td>
                    <Table.Td>{flow.flow_name}</Table.Td>
                    <Table.Td>{flow.status}</Table.Td>
                    <Table.Td>{flow.started_at}</Table.Td>
                    <Table.Td>{flow.completed_at ?? '—'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}
