"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminHeader } from "@/components/admin/header";

import { useSettingImages } from "@/hooks/useSettingImages";
import { updateSettingImage } from "@/actions/update-setting-image";

import { Skeleton } from "@/components/ui/skeleton";

import FooterSettingsCard from "./FooterSettingsCard";
import SocialMediaCard from "./SocialMediaCard";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useRouter } from "next/navigation";

import { revalidateData } from "@/actions/revalidate-data";
import { Image as ImageIcon } from "lucide-react"; 

export default function BasicSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basicInfo" |"statistics" | "footerSettings" | "socialMedia">("basicInfo");
  const [loading, setLoading] = useState(false);
  
  const [bgUrl, setBgUrl] = useState("");
  // ================= 修改点 1: 新增透明度状态 (默认85) =================
  const [bgOpacity, setBgOpacity] = useState(85);
  // ===================================================================

  const [settings, setSettings] = useState({
    websiteName: "",
    logoUrl: "",
    faviconUrl: "",
    githubUrl: "",
    twitterUrl: "",
    discordUrl: "",
    weixinUrl: "",
    weiboUrl: "",
    bilibiliUrl: "",
    zhihuUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
    copyrightText: "",
    contactEmail: "",
    googleAnalyticsId: "",
    clarityId: "",
  });

  // 加载设置数据
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // 1. 加载基础设置
        const response = await fetch("/api/settings?group=basic");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Load settings failed");
        }
        const data = await response.json();
        const sanitizedData = Object.keys(data).reduce(
          (acc, key) => ({
            ...acc,
            [key]: data[key] ?? "",
          }),
          {}
        );
        setSettings((prev) => ({ ...prev, ...sanitizedData }));

        // ================= 修改点 2: 加载背景图和透明度 =================
        const bgResponse = await fetch("/api/settings/background");
        if (bgResponse.ok) {
          const bgData = await bgResponse.json();
          if (bgData.url) setBgUrl(bgData.url);
          // 如果有透明度值，更新状态
          if (bgData.opacity !== undefined) setBgOpacity(Number(bgData.opacity));
        }
        // ==============================================================

      } catch (error) {
        console.error("Load settings error:", error);
        toast.error(error instanceof Error ? error.message : "Load settings failed");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Submitted settings for tab:", activeTab); 
   
      const saveSettingPromises = [];
   
      // 根据当前标签页筛选需要保存的设置项
      const settingsToSave = (() => {
        switch (activeTab) {
          case "basicInfo":
            return {
              websiteName: settings.websiteName,
            };
          case "statistics":
            return {
              googleAnalyticsId: settings.googleAnalyticsId,
              clarityId: settings.clarityId
            };
          case "footerSettings":
            return {
              copyrightText: settings.copyrightText,
              contactEmail: settings.contactEmail
            };
          case "socialMedia":
            return {
              githubUrl: settings.githubUrl,
              twitterUrl: settings.twitterUrl,
              discordUrl: settings.discordUrl,
              weixinUrl: settings.weixinUrl,
              weiboUrl: settings.weiboUrl,
              bilibiliUrl: settings.bilibiliUrl,
              zhihuUrl: settings.zhihuUrl,
              youtubeUrl: settings.youtubeUrl,
              linkedinUrl: settings.linkedinUrl
            };
          default:
            return {};
        }
      })();
   
      // 处理图片上传（仅针对基本信息标签页）
      if (activeTab === "basicInfo") {
        const logoInput = document.getElementById('logoUrl') as HTMLInputElement;
        const faviconInput = document.getElementById('faviconUrl') as HTMLInputElement;
   
        if (logoInput && logoInput.files && logoInput.files.length > 0) {
          const logoFile = logoInput.files[0];
          const logoFormData = new FormData();
          logoFormData.append('settingKey', 'logoUrl');
          logoFormData.append('file', logoFile);
          saveSettingPromises.push(
            updateSettingImage(logoFormData)
          );
        }
   
        if (faviconInput && faviconInput.files && faviconInput.files.length > 0) {
          const faviconFile = faviconInput.files[0];
          const faviconFormData = new FormData();
          faviconFormData.append('settingKey', 'faviconUrl');
          faviconFormData.append('file', faviconFile);
          saveSettingPromises.push(
            updateSettingImage(faviconFormData)
          );
        }

        // ================= 修改点 3: 同时保存 URL 和 透明度 =================
        saveSettingPromises.push(
          fetch("/api/settings/background", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              url: bgUrl, 
              opacity: bgOpacity // 发送透明度
            }),
          })
        );
        // =================================================================
      }
   
      // 添加基本设置保存到 saveSettingPromises
      saveSettingPromises.push(
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsToSave),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Save failed");
          }
          return response.json();
        })
      );
   
      // 并行处理所有操作
      await Promise.all(saveSettingPromises);
   
      toast.success(`Settings saved`);
 
      revalidateData();
    } catch (error) {
      console.error("Save settings failed:", error);
      toast.error(error instanceof Error ? error.message : "Save settings failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#f9f9f9]">
      <AdminHeader title="Basic Settings" />

      <div className="mx-auto px-4 py-12 bg-[#f9f9f9]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basicInfo">Basic Info</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="footerSettings">Footer</TabsTrigger>
              <TabsTrigger value="socialMedia">Social Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basicInfo">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Basic Information
                </p>
                <Card className="border bg-white">
                  <CardHeader className="border-b">
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Set the basic information of your website</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6">
                    <div className="grid gap-2">
                      <Label htmlFor="websiteName">Website Name</Label>
                      <Input
                        id="websiteName"
                        name="websiteName"
                        value={settings.websiteName}
                        onChange={handleChange}
                        placeholder="Enter your website name"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Website Logo</Label>
                      <LogoUploader />
                    </div>

                    <div className="grid gap-2">
                      <Label>Website Favicon</Label>
                      <FaviconUploader />
                    </div>

                    {/* ================= 修改点 4: 背景图和透明度设置 UI ================= */}
                    <div className="grid gap-2 pt-4 border-t mt-2">
                      <Label htmlFor="bgUrl">Main Page Background</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="bgUrl"
                          placeholder="https://example.com/background.jpg"
                          value={bgUrl}
                          onChange={(e) => setBgUrl(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Enter a direct link to an image (JPG, PNG, WebP). Leave empty to use default theme.
                      </p>
                      
                      {/* 透明度滑块 (仅当有背景图时显示) */}
                      {bgUrl && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border space-y-3">
                           <div className="flex justify-between items-center">
                              <Label htmlFor="opacity" className="text-sm font-medium">
                                Overlay Intensity (Mask)
                              </Label>
                              <span className="text-sm font-bold bg-white px-2 py-1 rounded border">
                                {bgOpacity}%
                              </span>
                           </div>
                           
                           <input
                              type="range"
                              id="opacity"
                              min="0"
                              max="100"
                              step="5"
                              value={bgOpacity}
                              onChange={(e) => setBgOpacity(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                           />
                           
                           <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                             <span>0% (Clear Image)</span>
                             <span>100% (Solid Color)</span>
                           </div>
                        </div>
                      )}

                      {/* 预览区域 */}
                      {bgUrl && (
                        <div className="mt-2 border rounded-md overflow-hidden h-40 relative bg-muted w-full">
                          {/* 背景层 */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${bgUrl})` }}
                          />
                          {/* 遮罩层 - 使用背景色 + 透明度 */}
                          <div 
                             className="absolute inset-0 bg-white dark:bg-black transition-all duration-300"
                             style={{ opacity: bgOpacity / 100 }}
                          />
                          {/* 模拟文字 */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                             <div className="text-xl font-bold text-foreground z-10">Preview Title</div>
                             <div className="text-sm text-muted-foreground z-10">Adjust opacity to make text readable</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* ===================================================================== */}

                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics">
              {/* ... 统计设置保持不变 ... */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Statistics Code
                </p>
                <Card className="border bg-white">
                  <CardHeader className="border-b">
                    <CardTitle>Statistics Code</CardTitle>
                    <CardDescription>Set the statistics code of your website</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6">
                    <div className="grid gap-2">
                      <Label htmlFor="googleAnalyticsId">
                        Google Analytics ID
                      </Label>
                      <Input
                        id="googleAnalyticsId"
                        name="googleAnalyticsId"
                        value={settings.googleAnalyticsId}
                        onChange={handleChange}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="clarityId">Microsoft Clarity ID</Label>
                      <Input
                        id="clarityId"
                        name="clarityId"
                        value={settings.clarityId}
                        onChange={handleChange}
                        placeholder="XXXXXXXXXX"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="footerSettings">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Footer Settings
                </p>
                <FooterSettingsCard
                  settings={settings}
                  handleChange={handleChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="socialMedia">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  Social Media Links
                </p>
                <SocialMediaCard
                  settings={settings}
                  handleChange={handleChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// LogoUploader 和 FaviconUploader 保持不变...
function LogoUploader() {
  const { images, isLoading, error } = useSettingImages("logoUrl");
  const [currentLogoUrl, setCurrentLogoUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      // 立即展示预览
      setCurrentLogoUrl(base64);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="relative w-[260px] h-[60px] border rounded bg-white">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <Image
              src={currentLogoUrl || images[0].url}
              alt="Current Logo"
              fill
              className="object-contain p-2"
            />
          )}
        </div>
        <Input
          id="logoUrl"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          className="max-w-[200px] bg-slate-100"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Recommended size: 520x120px, supports PNG, JPG format
      </p>
    </div>
  );
};

function FaviconUploader() {
  const { images, isLoading, error } = useSettingImages("faviconUrl");
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      // 立即展示预览
      setCurrentFaviconUrl(base64);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="relative w-[32px] h-[32px] border rounded bg-white">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="relative w-[32px] h-[32px] border rounded bg-white">
            <Image
              src={currentFaviconUrl || images[0].url}
              alt="Current Favicon"
              fill
              className="object-contain p-1"
            />
          </div>
        )}
        <Input
          id="faviconUrl"
          type="file"
          accept=".ico,.png"
          onChange={handleFileChange}
          className="max-w-[200px] bg-slate-100"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Recommended size: 512x512px, supports ICO, PNG format
      </p>
    </div>
  );
};
