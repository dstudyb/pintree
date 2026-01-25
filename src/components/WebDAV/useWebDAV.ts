import { useState } from 'react';

// 直接在这里定义接口，解决找不到名称的问题
export interface WebDAVConfig {
  url: string;
  username: string;
  password?: string;
  remotePath: string;
}

export const useWebDAV = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const testConnection = async (config: WebDAVConfig) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/webdav/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: '请求失败' };
    } finally {
      setIsSyncing(false);
    }
  };

  return { isSyncing, testConnection };
};
