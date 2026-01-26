import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WebDAVConfigCardProps {
  settings: {
    webdav_url: string;
    webdav_username: string;
    webdav_password: string;
    webdav_path: string;
    [key: string]: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const WebDAVConfigCard = ({
  settings,
  handleChange,
}: WebDAVConfigCardProps) => {
  const [testing, setTesting] = useState(false);

  // 测试连接功能
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const payload = {
        url: settings.webdav_url,
        username: settings.webdav_username,
        password: settings.webdav_password,
        remotePath: settings.webdav_path || '/pintree/bookmarks.json'
      };

      const response = await fetch('/api/webdav/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '连接失败');
      }

      toast.success(result.message || '连接成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "连接测试失败");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border bg-white">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>
              Configure your WebDAV server details
            </CardDescription>
          </div>
          {/* 测试连接按钮放置在右上角 */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestConnection}
            disabled={testing || !settings.webdav_url}
          >
            {testing ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6">
        {/* 服务器地址 */}
        <div className="grid gap-2">
          <Label htmlFor="webdav_url">Server URL</Label>
          <Input
            id="webdav_url"
            name="webdav_url"
            value={settings.webdav_url}
            onChange={handleChange}
            placeholder="e.g., https://dav.jianguoyun.com/dav/"
          />
        </div>

        {/* 用户名和密码并排 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="webdav_username">Username</Label>
            <Input
              id="webdav_username"
              name="webdav_username"
              value={settings.webdav_username}
              onChange={handleChange}
              placeholder="Username"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="webdav_password">Password / Token</Label>
            <Input
              id="webdav_password"
              name="webdav_password"
              type="password"
              value={settings.webdav_password}
              onChange={handleChange}
              placeholder="App Password"
            />
          </div>
        </div>

        {/* 远程路径 */}
        <div className="grid gap-2">
          <Label htmlFor="webdav_path">Remote JSON Path</Label>
          <Input
            id="webdav_path"
            name="webdav_path"
            value={settings.webdav_path}
            onChange={handleChange}
            placeholder="/pintree/bookmarks.json"
          />
          <p className="text-xs text-muted-foreground">
            Default: /pintree/bookmarks.json
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebDAVConfigCard;
