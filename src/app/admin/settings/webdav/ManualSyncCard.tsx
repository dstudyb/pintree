import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CloudUpload, CloudDownload, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ManualSyncCard = () => {
  const [syncing, setSyncing] = useState<"upload" | "download" | null>(null);

  const handleSync = async (action: "upload" | "download") => {
    // 确认对话框
    if (!confirm(action === 'upload' 
      ? "确认将当前数据库备份覆盖到云端吗？" 
      : "确认从云端恢复数据吗？这将覆盖当前所有数据！")) {
      return;
    }

    setSyncing(action);
    try {
      // 注意：这里不再需要从前端传 config，后端会自动从数据库读取
      // 保持了和之前建立的 sync/route.ts 的兼容性
      const response = await fetch("/api/webdav/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }), 
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success(data.message);
      
      if (action === 'download') {
        toast.info("页面即将刷新...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card className="border bg-white">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
           <RefreshCw className="w-5 h-5 text-indigo-600" />
           Sync Operations
        </CardTitle>
        <CardDescription>
          Manually backup or restore your data immediately
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-6">
        {/* 备份部分 */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
          <div>
            <h4 className="font-medium text-slate-900">Backup to Cloud</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Save current local data to WebDAV server
            </p>
          </div>
          <Button 
            onClick={() => handleSync("upload")} 
            disabled={syncing !== null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
          >
            {syncing === "upload" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="mr-2 h-4 w-4" />
            )}
            Backup Now
          </Button>
        </div>

        {/* 恢复部分 */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
          <div>
            <h4 className="font-medium text-slate-900">Restore from Cloud</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Overwrite local data with cloud backup
            </p>
          </div>
          <Button 
            onClick={() => handleSync("download")} 
            disabled={syncing !== null}
            variant="outline"
            className="hover:bg-red-50 hover:text-red-600 border-red-200 min-w-[140px]"
          >
            {syncing === "download" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="mr-2 h-4 w-4" />
            )}
            Restore Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualSyncCard;
