import { useState } from 'react';
import { WebDAVConfig } from './types';

export const useWebDAV = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const testConnection = async (config: WebDAVConfig) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/webdav/test', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      return await response.json();
    } finally {
      setIsSyncing(false);
    }
  };

  return { isSyncing, testConnection };
};
