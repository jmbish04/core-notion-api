import { useCallback } from 'react';
import { useApiContext } from '../context/ApiContext';

export function useWorkerClient() {
  const { apiKey } = useApiContext();

  const request = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers ?? {});
      if (apiKey) {
        headers.set('Authorization', `Bearer ${apiKey}`);
      }
      const response = await fetch(input, { ...init, headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      const contentType = response.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        return response.json();
      }
      return response.text();
    },
    [apiKey]
  );

  return request;
}
