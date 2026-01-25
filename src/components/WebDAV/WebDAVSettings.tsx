import React, { useState, useEffect } from 'react';
import { Settings, Link, User, Lock, Folder, Save, RefreshCw, AlertCircle, CheckCircle2, CloudUpload, CloudDownload, X } from 'lucide-react';

/**
 * WebDAV 配置与同步界面
 */
const WebDAVSettings = ({ onClose }: { onClose?: () => void }) => {
  const [config, setConfig] = useState({
    url: '',
    username: '',
    password: '',
    remotePath: '/pintree/bookmarks.json'
  });

  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // 初始化读取本地存储
  useEffect(() => {
    const savedUrl = localStorage.getItem('pintree_webdav_url');
    const savedUser = localStorage.getItem('pintree_webdav_user');
    if (savedUrl) setConfig(prev => ({ ...prev, url: savedUrl }));
    if (savedUser) setConfig(prev => ({ ...prev, username: savedUser }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  // 通用的 API 调用函数
  const callSyncApi = async (action: 'upload' | 'download' | 'test') => {
    setLoading(true);
    setSyncStatus('idle');
    setMessage('');

    try {
      // 修改点 1: 移除 data 字段，不再由前端传递数据
      const payload = {
        action: action === 'test' ? 'download' : action, // Test 本质上是尝试读取
        config: config,
      };

      const endpoint = action === 'test' ? '/api/webdav/test' : '/api/webdav/sync';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      // 3. 处理成功
      setSyncStatus('success');
      
      if (action === 'upload') {
        setMessage(result.message || '备份成功！数据已上传到云端。');
      } else if (action === 'download') {
        // 修改点 2: 恢复成功后刷新页面
        setMessage('恢复成功！页面即将刷新...');
        setTimeout(() => {
           window.location.reload();
        }, 1500);
      } else {
        setMessage('连接验证成功！');
        // 保存非敏感信息
        localStorage.setItem('pintree_webdav_url', config.url);
        localStorage.setItem('pintree_webdav_user', config.username);
      }

    } catch (err: any) {
      setSyncStatus('error');
      setMessage(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full bg-white rounded-2xl shadow-xl overflow-hidden text-sm">
      {/* 标题栏 */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-600" /> 
          WebDAV 同步中心
        </h3>
        {onClose && <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>}
      </div>

      <div className="p-6 space-y-4">
        {/* 输入区域 */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">服务器地址</label>
            <input name="url" value={config.url} onChange={handleChange} placeholder="https://dav.jianguoyun.com/dav/" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">用户名</label>
              <input name="username" value={config.username} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">应用密码</label>
              <input name="password" type="password" value={config.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">同步文件路径 (JSON)</label>
            <input name="remotePath" value={config.remotePath} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-600" />
          </div>
        </div>

        {/* 状态提示 */}
        {message && (
          <div className={`p-3 rounded-lg flex gap-2 ${syncStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {syncStatus === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
            <span>{message}</span>
          </div>
        )}

        {/* 操作按钮组 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* 上传按钮 */}
          <button 
            onClick={() => callSyncApi('upload')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            备份到云端
          </button>

          {/* 下载按钮 */}
          <button 
            onClick={() => callSyncApi('download')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <CloudDownload className="w-4 h-4" />
            恢复到本地
          </button>
        </div>
        
        <div className="text-center">
             <button onClick={() => callSyncApi('test')} className="text-xs text-slate-400 hover:text-indigo-500 underline">
                仅测试连接
             </button>
        </div>
      </div>
    </div>
  );
};

export default WebDAVSettings;
