"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BookmarkGrid } from "@/components/bookmark/BookmarkGrid";
import { Header } from "@/components/website/header";

import { Footer } from "@/components/website/footer";
import { TopBanner } from "@/components/website/top-banner";

import { GetStarted } from "@/components/website/get-started";
import { BackToTop } from "@/components/website/back-to-top";

import { Collection } from "@prisma/client";

// ================= 修改点 1: 引入 UI 组件和图标 =================
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, ArrowRight } from "lucide-react";
// =============================================================

function SearchParamsComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionSlug = searchParams.get("collection");

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const routeToFolderInCollection = (collection: Collection, folderId?: string | null) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collection?.slug ? currentSearchParams.set("collection", collection.slug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`);
  }

  useEffect(() => {
    const folderId = searchParams.get("folderId");
    setCurrentFolderId(folderId);

    const fetchCollectionsAndSetDefault = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/collections?publicOnly=true");
        const data = await response.json();
        setCollections(data);

        // set selected collection by slug
        if (collectionSlug) {
          const currentCollection = data.find(
            (c: Collection) => c.slug === collectionSlug
          );
          if (currentCollection) {
            setSelectedCollectionId(currentCollection.id);
            setCollectionName(currentCollection.name);
          }
        } else {
          // ================= 再次修改点: 智能判断数量 =================
          if (data.length === 1) {
            // 场景 A: 只有一个集合 -> 自动选中，直接进入，不显示列表页
            const singleCollection = data[0];
            setSelectedCollectionId(singleCollection.id);
            setCollectionName(singleCollection.name);
            
            // 建议：顺便更新一下 URL，这样用户分享链接时能带上 collection 参数
            // 注意：这可能会触发 useEffect 再次运行，但因为有 collectionSlug 判断，是安全的
            // 如果不想 URL 变动，可以把下面这行注释掉
            routeToFolderInCollection(singleCollection); 
            
        } else {
          // ================= 修改点 2: 移除默认选中逻辑 =================
          // 原代码：const defaultCollection = data[0]; 强制选中第一个
          // 新代码：如果没有 slug，确保不选中任何集合，以便显示列表页
          setSelectedCollectionId("");
          setCollectionName("");
          // =========================================================
        }
      } catch (error) {
        console.error("获取 collections 失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionsAndSetDefault();
  // 注意：这里最好加上 collectionSlug 作为依赖，确保 URL 变化时重新判断
  }, [searchParams, collectionSlug]); 



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
    <div className="flex min-h-screen flex-col bg-background">
      <TopBanner />
      
      {/* ================= 修改点 3: 新增中间状态渲染 (集合列表页) ================= */}
      {/* 逻辑：不是加载中 && 有集合数据 && 当前没有选中具体集合 -> 显示卡片列表 */}
      {!isLoading && collections.length > 0 && !selectedCollectionId ? (
        <div className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Discover Collections</h1>
            <p className="text-lg text-muted-foreground">Select a collection to browse bookmarks.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card 
                key={collection.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50 group"
                onClick={() => handleCollectionChange(collection.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary group-hover:text-primary/80" />
                    {collection.name}
                  </CardTitle>
                  {collection.description && (
                    <CardDescription className="line-clamp-2">
                      {collection.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex justify-end">
                   <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:underline">
                     Browse <ArrowRight className="w-4 h-4" />
                   </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-20">
             <Footer />
          </div>
        </div>
      ) : (
      // =======================================================================
      
        <div className="flex flex-1">
          <SidebarProvider>
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
                <div className="flex flex-1 flex-col space-y-8">
                  <Header
                    selectedCollectionId={selectedCollectionId}
                    currentFolderId={currentFolderId}
                    onBookmarkAdded={refreshData}
                  />
                  <div className="flex-1 overflow-y-auto">
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
                  <Footer />
                </div>
                <BackToTop />
              </>
            ) : (
              <div className="flex flex-1">
                <GetStarted />
              </div>
            )}
          </SidebarProvider>
        </div>
      )}
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
