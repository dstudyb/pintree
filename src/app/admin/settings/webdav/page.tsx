"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin/header";

import WebDAVConfigCard from "./WebDAVConfigCard";
import ManualSyncCard from "./ManualSyncCard";
import { revalidateData } from "@/actions/revalidate-data";

export default function WebDAVSettingsPage() {
  const [activeTab, setActiveTab] = useState<"configuration" | "actions">("configuration");
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    webdav_url: "",
    webdav_username: "",
    webdav_password: "",
    webdav_path: "/pintree/bookmarks.json",
    webdav_autosync: "false", // 默认关闭
  });

  // 1. 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("Load settings failed");
        
        const data = await response.json();
        
        setSettings({
          webdav_url: data.webdav_url ?? "",
          webdav_username: data.webdav_username ?? "",
          webdav_password: data.webdav_password ?? "",
          webdav_path: data.webdav_path ?? "/pintree/bookmarks.json",
          // 读取数据库中的开关状态，如果没有则默认为 "false"
          webdav_autosync: data.webdav_autosync ?? "false",
        });
      } catch (error) {
        console.error(error);
        toast.error("加载设置失败");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 2. 处理普通输入
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  // 3. 处理 Switch 开关 (新增)
  const handleSwitchChange = (checked: boolean) => {
    setSettings((prev) => ({ 
        ...prev, 
        webdav_autosync: checked ? "true" : "false" 
    }));
  };

  // 4. 保存设置
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'actions') return;

    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Save failed");

      toast.success("WebDAV 设置已保存");
      revalidateData();
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#f9f9f9]">
      <AdminHeader title="WebDAV Settings" />

      <div className="mx-auto px-4 py-12 bg-[#f9f9f9]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="actions">Sync Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="configuration">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Server Configuration
                </p>
                <WebDAVConfigCard
                  settings={settings}
                  handleChange={handleChange}
                  onSwitchChange={handleSwitchChange} // 传递处理函数
                />
              </div>
            </TabsContent>

            <TabsContent value="actions">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Manual Operations
                </p>
                <ManualSyncCard />
              </div>
            </TabsContent>
          </Tabs>

          {activeTab === 'configuration' && (
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
