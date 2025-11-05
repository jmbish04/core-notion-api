import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ApiContextValue {
  apiKey: string;
  setApiKey: (value: string) => void;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

const STORAGE_KEY = 'worker-api-key';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (apiKey) {
      window.localStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [apiKey]);

  const value = useMemo<ApiContextValue>(() => ({ apiKey, setApiKey }), [apiKey]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiContext(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiContext must be used inside ApiProvider');
  }
  return context;
}
