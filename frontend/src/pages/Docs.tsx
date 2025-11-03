import { useEffect, useState } from 'react';
import { Center, Loader, Paper, Stack, Text } from '@mantine/core';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function DocsPage() {
  const [spec, setSpec] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/openapi/openapi.json')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setSpec(json);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Center>
        <Paper p="lg" radius="md" withBorder>
          <Stack>
            <Text fw={600}>Failed to load OpenAPI spec</Text>
            <Text c="red.4">{error}</Text>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!spec) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return <SwaggerUI spec={spec} />;
}
