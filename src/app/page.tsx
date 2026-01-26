"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BookmarkGrid } from "@/components/bookmark/BookmarkGrid";
import { Header } from "@/components/website/header";

import { Footer } from "@/components/website/footer";
import { TopBanner } from "@/components/website/top-banner";

// ================= 修改点 1: 移除 SiteHeader 的引入 (不再需要顶部导航栏) =================
// import { SiteHeader } from "@/components/website/site-header";
// ====================================================================================

import { GetStarted } from "@/components/website/get-started";
import { BackToTop } from "@/components/website/back-to-top";

import { Collection } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, ArrowRight } from "lucide-react";

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

    fetchCollectionsAndSetDefault();
  }, [searchParams]);



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
      
      {/* ================= 修改点 2: 移除了 SiteHeader 组件 ================= */}
      {/* <SiteHeader collections={collections} /> */} 
      {/* ================================================================== */}
      
      <div className="flex flex-1">
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
              <div className="flex flex-1 flex-col space-y-8 h-full overflow-hidden">
                <Header
                  selectedCollectionId={selectedCollectionId}
                  currentFolderId={currentFolderId}
                  onBookmarkAdded={refreshData}
                  // ================= 修改点 3: 将 collections 传给 Header =================
                  collections={collections}
                  // ======================================================================
                />
                
                <div 
                  id="main-scroll-container" 
                  className="flex-1 overflow-y-auto"
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
                  <Footer />
                </div>
              </div>
              
              <BackToTop scrollContainerId="main-scroll-container" />
            </>
          ) : (
            <div className="flex flex-1">
              <GetStarted />
            </div>
          )}
        </SidebarProvider>
        )}
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
