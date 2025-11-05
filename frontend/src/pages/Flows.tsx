import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Code,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useApiContext } from '../context/ApiContext';
import { useWorkerClient } from '../hooks/useWorkerClient';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FlowRunResult {
  flowRunId?: number;
  [key: string]: any;
}

function FlowUpdatesPanel({ flowRunId, flowName }: { flowRunId?: number; flowName: string }) {
  const { apiKey } = useApiContext();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!flowRunId || !apiKey || typeof window === 'undefined') {
      return;
    }

    const url = new URL(`/mcp/stream/${flowRunId}`, window.location.origin);
    url.searchParams.set('apiKey', apiKey);
    const source = new EventSource(url.toString());

    const appendEvent = (event: MessageEvent) => {
      try {
        const payload = event.data ? JSON.parse(event.data) : {};
        setEvents((prev) => [
          ...prev,
          {
            event: event.type || 'message',
            ...payload,
          },
        ]);
      } catch (error) {
        console.error('Failed to parse SSE payload', error);
      }
    };

    source.addEventListener('connected', appendEvent);
    source.addEventListener('message', appendEvent);
    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
      setEvents([]);
    };
  }, [flowRunId, apiKey]);

  if (!flowRunId) {
    return null;
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Title order={5}>
          {flowName} updates (Flow #{flowRunId})
        </Title>
        {events.length === 0 ? (
          <Text c="dimmed" size="sm">
            Listening for updates...
          </Text>
        ) : (
          events.map((event, index) => (
            <Code block key={`${flowRunId}-${index}`}>
              {JSON.stringify(event, null, 2)}
            </Code>
          ))
        )}
      </Stack>
    </Paper>
  );
}

function usePersistentState(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.localStorage.getItem(key) ?? defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [key, value]);

  return useMemo(() => [value, setValue] as const, [value]);
}

export function FlowsPage() {
  const { apiKey } = useApiContext();
  const client = useWorkerClient();
  const [notionToken, setNotionToken] = usePersistentState('notion-token', '');
  const [parentId, setParentId] = usePersistentState('notion-parent-id', '');
  const [markdownContent, setMarkdownContent] = useState('');
  const [aiModel, setAiModel] = useState('@cf/meta/llama-3-8b-instruct');

  const [parentType, setParentType] = useState<'page' | 'database'>('page');
  const [pageTitle, setPageTitle] = useState('');
  const [propertiesJson, setPropertiesJson] = useState('');
  const [blocksJson, setBlocksJson] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyValueJson, setPropertyValueJson] = useState('');
  const [filterJson, setFilterJson] = useState('');

  const [loadingFlow, setLoadingFlow] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<FlowRunResult | null>(null);
  const [lastFlowName, setLastFlowName] = useState<string | null>(null);

  const flowNameMap = useMemo(
    () => ({
      create: 'createPageWithBlocks',
      search: 'searchAndTag',
      markdown: 'orchestrateMarkdownToPages',
    }),
    []
  );

  const runFlow = async (flow: 'create' | 'search' | 'markdown', payload: any) => {
    if (!apiKey) {
      setFlowError('WORKER_API_KEY is required');
      return;
    }
    if (!notionToken) {
      setFlowError('Notion integration token is required');
      return;
    }

    try {
      setLoadingFlow(flow);
      setLastFlowName(flow);
      setFlowError(null);
      const endpoint =
        flow === 'create'
          ? '/api/flows/createPageWithBlocks'
          : flow === 'search'
          ? '/api/flows/searchAndTag'
          : '/api/flows/orchestrateMarkdownToPages';

      const response = (await client(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as ApiResponse<FlowRunResult>;

      if (!response.success) {
        throw new Error(response.error || 'Flow failed');
      }

      setLatestResult(response.data ?? null);
    } catch (error: any) {
      setFlowError(error.message);
      setLatestResult(null);
    } finally {
      setLoadingFlow(null);
    }
  };

  const submitCreatePage = async () => {
    try {
      const properties = propertiesJson ? JSON.parse(propertiesJson) : undefined;
      const blocks = blocksJson ? JSON.parse(blocksJson) : undefined;
      const parent =
        parentType === 'page'
          ? { page_id: parentId }
          : { database_id: parentId };

      await runFlow('create', {
        notion_token: notionToken,
        parent,
        title: pageTitle,
        properties,
        blocks,
      });
    } catch (error: any) {
      setFlowError(`Invalid JSON input: ${error.message}`);
    }
  };

  const submitSearchAndTag = async () => {
    try {
      const propertyValue = propertyValueJson ? JSON.parse(propertyValueJson) : undefined;
      const filter = filterJson ? JSON.parse(filterJson) : undefined;
      await runFlow('search', {
        notion_token: notionToken,
        query: searchQuery,
        property_name: propertyName,
        property_value: propertyValue,
        filter,
      });
    } catch (error: any) {
      setFlowError(`Invalid JSON input: ${error.message}`);
    }
  };

  const submitMarkdownOrchestration = async () => {
    await runFlow('markdown', {
      notion_token: notionToken,
      base_parent_page_id: parentId,
      markdown_content: markdownContent,
      ai_model: aiModel,
    });
  };

  return (
    <Stack gap="lg">
      <Paper withBorder p="lg" radius="md">
        <Stack gap="sm">
          <Title order={3}>Shared credentials</Title>
          <TextInput
            label="Notion integration token"
            placeholder="secret_..."
            value={notionToken}
            onChange={(event) => setNotionToken(event.currentTarget.value)}
          />
          <TextInput
            label="Parent ID (page or database)"
            placeholder="Parent page/database ID"
            value={parentId}
            onChange={(event) => setParentId(event.currentTarget.value)}
          />
          {flowError && (
            <Text c="red.4" size="sm">
              {flowError}
            </Text>
          )}
        </Stack>
      </Paper>

      <Tabs defaultValue="markdown">
        <Tabs.List>
          <Tabs.Tab value="markdown">Markdown orchestration</Tabs.Tab>
          <Tabs.Tab value="create">Create page with blocks</Tabs.Tab>
          <Tabs.Tab value="search">Search and tag</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="markdown" pt="md">
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Title order={4}>Markdown to Notion pages</Title>
              <TextInput
                label="AI model"
                value={aiModel}
                onChange={(event) => setAiModel(event.currentTarget.value)}
                placeholder="@cf/meta/llama-3-8b-instruct"
              />
              <Textarea
                label="Markdown content"
                placeholder="# Page title\n\nContent..."
                minRows={12}
                value={markdownContent}
                onChange={(event) => setMarkdownContent(event.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button onClick={submitMarkdownOrchestration} loading={loadingFlow === 'markdown'}>
                  Run orchestration
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="create" pt="md">
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Title order={4}>Create page with blocks</Title>
              <SegmentedControl
                value={parentType}
                onChange={(value: 'page' | 'database') => setParentType(value)}
                data={[
                  { label: 'Parent page', value: 'page' },
                  { label: 'Parent database', value: 'database' },
                ]}
              />
              <TextInput
                label="Title"
                value={pageTitle}
                onChange={(event) => setPageTitle(event.currentTarget.value)}
              />
              <Textarea
                label="Properties (JSON)"
                description="Optional additional properties"
                minRows={4}
                value={propertiesJson}
                onChange={(event) => setPropertiesJson(event.currentTarget.value)}
              />
              <Textarea
                label="Blocks (JSON)"
                description="Optional array of block objects"
                minRows={4}
                value={blocksJson}
                onChange={(event) => setBlocksJson(event.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button onClick={submitCreatePage} loading={loadingFlow === 'create'}>
                  Create page
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="md">
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Title order={4}>Search and tag</Title>
              <TextInput
                label="Search query"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <TextInput
                label="Property name"
                value={propertyName}
                onChange={(event) => setPropertyName(event.currentTarget.value)}
              />
              <Textarea
                label="Property value (JSON)"
                minRows={3}
                value={propertyValueJson}
                onChange={(event) => setPropertyValueJson(event.currentTarget.value)}
              />
              <Textarea
                label="Filter (JSON)"
                description="Optional Notion search filter"
                minRows={3}
                value={filterJson}
                onChange={(event) => setFilterJson(event.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button onClick={submitSearchAndTag} loading={loadingFlow === 'search'}>
                  Run search & tag
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {latestResult && (
        <Stack gap="sm">
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Title order={4}>Latest result</Title>
              <Code block>{JSON.stringify(latestResult, null, 2)}</Code>
            </Stack>
          </Paper>
          {lastFlowName && latestResult.flowRunId && (
            <FlowUpdatesPanel
              flowRunId={latestResult.flowRunId}
              flowName={flowNameMap[lastFlowName as keyof typeof flowNameMap]}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
