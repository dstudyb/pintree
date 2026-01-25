import React, { useState, useEffect } from 'react';
import { Settings, Link, User, Lock, Folder, Save, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';

/**
 * WebDAV 配置界面组件
 * 放置位置：src/components/WebDAV/WebDAVSettings.tsx
 */
const WebDAVSettings = ({ onClose }: { onClose?: () => void }) => {
  // 表单状态
  const [config, setConfig] = useState({
    url: '',
    username: '',
    password: '',
    remotePath: '/pintree/bookmarks.json'
  });

  // UI 交互状态
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // 初始化时从 LocalStorage 读取（不含密码）
  useEffect(() => {
    const savedUrl = localStorage.getItem('pintree_webdav_url');
    const savedUser = localStorage.getItem('pintree_webdav_user');
    if (savedUrl || savedUser) {
      setConfig(prev => ({ ...prev, url: savedUrl || '', username: savedUser || '' }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // 测试连接与保存逻辑
  const handleSaveAndTest = async () => {
    setLoading(true);
    setStatus('idle');
    
    try {
      // 1. 发送测试请求到 Next.js API Route
      const response = await fetch('/api/webdav/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('连接成功！配置已就绪。');
        // 2. 只有成功后才保存非敏感信息到本地
        localStorage.setItem('pintree_webdav_url', config.url);
        localStorage.setItem('pintree_webdav_user', config.username);
      } else {
        throw new Error(data.message || '连接失败');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || '网络请求错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* 关闭按钮 (如果是 Modal 模式) */}
      {onClose && (
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">同步引擎配置</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">WebDAV Protocol</p>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="p-6 space-y-5">
        <div className="space-y-4">
          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
              <Link className="w-3.5 h-3.5" /> 服务器地址
            </label>
            <input 
              name="url"
              value={config.url}
              onChange={handleChange}
              type="url" 
              placeholder="https://dav.example.com/dav/"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* User */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <User className="w-3.5 h-3.5" /> 用户名
              </label>
              <input 
                name="username"
                value={config.username}
                onChange={handleChange}
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-700"
              />
            </div>
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <Lock className="w-3.5 h-3.5" /> 应用密码
              </label>
              <input 
                name="password"
                value={config.password}
                onChange={handleChange}
                type="password" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-700"
              />
            </div>
          </div>

          {/* Path */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
              <Folder className="w-3.5 h-3.5" /> 同步文件路径
            </label>
            <input 
              name="remotePath"
              value={config.remotePath}
              onChange={handleChange}
              type="text" 
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm italic"
            />
          </div>
        </div>

        {/* Status Messages */}
        {status !== 'idle' && (
          <div className={`p-3 rounded-xl flex items-center gap-3 border ${
            status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            {status === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-[11px] leading-relaxed text-slate-500">
            Pintree 遵循零信任安全策略。您的密码仅用于当前 API 转发请求，不会明文持久化在浏览器中。建议使用云盘提供的<b>应用专用密码</b>。
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-200">
        <button 
          onClick={handleSaveAndTest}
          disabled={loading || !config.url || !config.password}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-bold shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {loading ? '正在验证并连接...' : '验证并保存同步配置'}
        </button>
      </div>
    </div>
  );
};

export default WebDAVSettings;
