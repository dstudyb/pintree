"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BookmarkGrid } from "@/components/bookmark/BookmarkGrid";
import { Header } from "@/components/website/header";
import { TopBanner } from "@/components/website/top-banner";
import { useSession } from "next-auth/react";
import { GetStarted } from "@/components/website/get-started";
import { BackToTop } from "@/components/website/back-to-top";
import { Collection } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, ArrowRight } from "lucide-react";

function SearchParamsComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionSlug = searchParams.get("collection");

  const { status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  
  const [bgImage, setBgImage] = useState<string>("");
  const [bgOpacity, setBgOpacity] = useState<number>(0.85); 
  
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const routeToFolderInCollection = (collection: Collection, folderId?: string | null) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collection?.slug ? currentSearchParams.set("collection", collection.slug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`);
  }

  // 获取背景设置
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetch("/api/settings/background");
        const data = await res.json();
        if (data.url) {
          setBgImage(data.url);
        }
        if (data.opacity !== undefined) {
          setBgOpacity(data.opacity / 100);
        }
      } catch (e) {
        console.error("Failed to load background", e);
      }
    };
    fetchBackground();
  }, []);

  // 获取集合数据并处理默认跳转
  useEffect(() => {
    const folderId = searchParams.get("folderId");
    setCurrentFolderId(folderId);

    const fetchCollectionsAndSetDefault = async () => {
      try {
        setIsLoading(true);
        
        const apiUrl = status === "authenticated" 
          ? "/api/collections" 
          : "/api/collections?publicOnly=true";
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        setCollections(data);

        // 1. 如果 URL 里指定了 collection，优先使用它
        if (collectionSlug) {
          const currentCollection = data.find(
            (c: Collection) => c.slug === collectionSlug
          );
          if (currentCollection) {
            setSelectedCollectionId(currentCollection.id);
            setCollectionName(currentCollection.name);
          }
        } else {
          // 2. 如果 URL 没指定，默认直接进入第一个集合
          if (data.length > 0) {
             const firstCollection = data[0];
             setSelectedCollectionId(firstCollection.id);
             setCollectionName(firstCollection.name);
             
             // 只有当 URL 没有指定具体文件夹时，才执行路由跳转
             // 这样可以避免覆盖用户的深层链接（例如分享链接）
             if (!folderId) {
                routeToFolderInCollection(firstCollection);
             }
          } else {
             // 真的一个集合都没有
             setSelectedCollectionId("");
             setCollectionName("");
          }
        }
      } catch (error) {
        console.error("获取 collections 失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== "loading") {
      fetchCollectionsAndSetDefault();
    }
    
  }, [searchParams, status]);

  const handleCollectionChange = (id: string) => {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;

    setSelectedCollectionId(id);
    setCollectionName(collection.name || "");
    setCurrentFolderId(null);

    routeToFolderInCollection(collection);
  };

  const handleFolderSelect = (id: string | null) => {
    const collection = collections.find((c) => c.id === selectedCollectionId);
    if (!collection) return;

    routeToFolderInCollection(collection, id);
    setCurrentFolderId(id);
  };

  const refreshData = useCallback(async () => {
    if (selectedCollectionId) {
      try {
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("刷新数据失败:", error);
      }
    }
  }, [selectedCollectionId, currentFolderId]);

  return (
    <div 
      className="flex h-screen w-full flex-col overflow-hidden bg-background transition-all duration-500 ease-in-out"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed", 
      }}
    >
      <div 
        className={`flex h-full flex-col ${bgImage ? 'backdrop-blur-sm' : ''}`}
        style={{
          backgroundColor: bgImage ? `hsl(var(--background) / ${bgOpacity})` : undefined
        }}
      >
        <TopBanner />
        
        <div className="flex flex-1 overflow-hidden">
          {/* 修改逻辑：
              只要有集合且已选中（默认会选中第一个），就显示内容页。
              只有当数据加载完且真的没有任何集合时，才显示 "Discover Collections" 或 "Get Started"
          */}
          {!isLoading && collections.length > 0 && !selectedCollectionId ? (
             /* 理论上现在不会进入这里，除非数据出错 */
             <div className="flex-1 container mx-auto px-4 py-12 overflow-y-auto hide-scrollbar">
                {/* 保留这个视图作为容错，或者供没有默认选中时使用 */}
                {/* ... 卡片列表 ... */}
             </div>
          ) : (
            <SidebarProvider
              style={{ minHeight: "100%", height: "100%" } as React.CSSProperties}
              className="flex w-full h-full"
            >
            {
            isLoading && !collections.length ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : 
            selectedCollectionId || collectionSlug ? (
              <>
                <WebsiteSidebar
                  selectedCollectionId={selectedCollectionId}
                  currentFolderId={currentFolderId}
                  onCollectionChange={handleCollectionChange}
                  onFolderSelect={handleFolderSelect}
                />
                <div className="flex flex-1 flex-col space-y-8 h-full overflow-hidden">
                  <Header
                    selectedCollectionId={selectedCollectionId}
                    currentFolderId={currentFolderId}
                    onBookmarkAdded={refreshData}
                    collections={collections}
                  />
                  
                  <div 
                    id="main-scroll-container" 
                    className="flex-1 overflow-y-auto pb-24 hide-scrollbar"
                  >
                    <BookmarkGrid
                      key={`${selectedCollectionId}-${currentFolderId}`}
                      collectionId={selectedCollectionId}
                      currentFolderId={currentFolderId}
                      collectionName={collectionName}
                      collectionSlug={
                        collections.find((c) => c.id === selectedCollectionId)
                          ?.slug || ""
                      }
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                </div>
                
                <BackToTop scrollContainerId="main-scroll-container" />
              </>
            ) : (
              <div className="flex flex-1 h-full overflow-y-auto hide-scrollbar">
                <GetStarted />
              </div>
            )}
          </SidebarProvider>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsComponent />
    </Suspense>
  );
}
