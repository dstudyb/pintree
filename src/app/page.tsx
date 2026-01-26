"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BookmarkGrid } from "@/components/bookmark/BookmarkGrid";
import { Header } from "@/components/website/header";

// ================= 修改点 1: 注释掉 Footer 引用 =================
// import { Footer } from "@/components/website/footer";
// ==============================================================

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
  
  // ================= 修改点: 新增透明度 state (默认 0.85) =================
  const [bgImage, setBgImage] = useState<string>("");
  const [bgOpacity, setBgOpacity] = useState<number>(0.85); 
  // =========================================================================
  
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const routeToFolderInCollection = (collection: Collection, folderId?: string | null) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collection?.slug ? currentSearchParams.set("collection", collection.slug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`);
  }

  // ================= 修改点: 更新获取背景设置逻辑 =================
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetch("/api/settings/background");
        const data = await res.json();
        if (data.url) {
          setBgImage(data.url);
        }
        // 如果有透明度配置，应用它 (0-100 转为 0.0-1.0)
        if (data.opacity !== undefined) {
          setBgOpacity(data.opacity / 100);
        }
      } catch (e) {
        console.error("Failed to load background", e);
      }
    };
    fetchBackground();
  }, []);
  // =====================================================================

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
          // 智能判断数量 (1个自动进，多个手动选)
          if (data.length === 1) {
             const singleCollection = data[0];
             setSelectedCollectionId(singleCollection.id);
             setCollectionName(singleCollection.name);
             routeToFolderInCollection(singleCollection);
          } else {
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
      // ================= 修改点 5: 锁定页面高度禁止整体滚动 =================
      className="flex h-screen w-full flex-col overflow-hidden bg-background transition-all duration-500 ease-in-out"
      // ======================================================================
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed", 
      }}
    >
      {/* ================= 修改点: 动态应用透明度遮罩 ================= */}
      <div 
        // ================= 修改点 6: 遮罩层也跟随锁定高度 =================
        className={`flex h-full flex-col ${bgImage ? 'backdrop-blur-sm' : ''}`}
        // =================================================================
        style={{
          backgroundColor: bgImage ? `hsl(var(--background) / ${bgOpacity})` : undefined
        }}
      >
      {/* =============================================================== */}
        
        <TopBanner />
        
        {/* ================= 修改点 7: 容器 overflow 限制 ================= */}
        <div className="flex flex-1 overflow-hidden">
        {/* ================================================================ */}
          {!isLoading && collections.length > 0 && !selectedCollectionId ? (
             // ================= 修改点 8: Discover 页允许垂直滚动 (添加 hide-scrollbar) =================
             <div className="flex-1 container mx-auto px-4 py-12 overflow-y-auto hide-scrollbar">
             {/* ======================================================================================== */}
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

             {/* ================= 修改点 2: 注释掉底部 Footer (Discover 页) ================= */}
             {/* <div className="mt-20">
                <Footer />
             </div> */}
             {/* ============================================================================ */}

           </div>
          ) : (
            // ================= 修改点 9: 强制 SidebarProvider 撑满且不溢出 =================
            <SidebarProvider
              style={{ minHeight: "100%", height: "100%" } as React.CSSProperties}
              className="flex w-full h-full"
            >
            {/* ============================================================================ */}
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
                    // ================= 修改点 11: 添加 hide-scrollbar 隐藏滚动条 =================
                    // pb-24 (96px) 保持底部留白
                    className="flex-1 overflow-y-auto pb-24 hide-scrollbar"
                    // ===========================================================================
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
                    
                    {/* ================= 修改点 3: 注释掉底部 Footer (列表页) ================= */}
                    {/* <Footer /> */}
                    {/* ======================================================================= */}

                  </div>
                </div>
                
                <BackToTop scrollContainerId="main-scroll-container" />
              </>
            ) : (
              // ================= 修改点 10: GetStarted 区域允许滚动 (添加 hide-scrollbar) =================
              <div className="flex flex-1 h-full overflow-y-auto hide-scrollbar">
              {/* ======================================================================================== */}
                <GetStarted />
              </div>
            )}
          </SidebarProvider>
          )}
        </div>
      </div>
      {/* 遮罩层结束 */}
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
