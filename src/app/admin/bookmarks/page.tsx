"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, ChevronRight, LayoutGrid, List } from "lucide-react";
import { BookmarkDataTable } from "@/components/bookmark/BookmarkDataTable";
import { CreateBookmarkDialog } from "@/components/bookmark/CreateBookmarkDialog";
import { CreateFolderDialog } from "@/components/folder/CreateFolderDialog";
import { ContentManager } from "@/components/admin/ContentManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHeader } from "@/components/admin/header";
import { Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

// 保持之前的修复：去掉了可选属性中的 | null
interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  isFeatured: boolean;
  sortOrder: number;
  viewCount: number;
  collectionId: string;
  folderId?: string;
  folder?: {
    name: string;
  };
  collection?: {
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
  icon?: string;
  isPublic: boolean;
  sortOrder: number;
  parentId: string | null;
  _count?: { bookmarks: number };
  createdAt: string;
  updatedAt: string;
}

export default function BookmarksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<"table" | "sort">("table"); 

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [bookmarks, setBookmarks] = useState<{
    currentBookmarks: Bookmark[];
    subfolders: Folder[];
  }>({
    currentBookmarks: [],
    subfolders: []
  });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"createdAt" | "updatedAt" | "sortOrder">("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);
  const [folders, setFolders] = useState<Folder[]>([]); 
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      const data = await response.json();
      setCollections(data);
      
      const collectionId = searchParams.get("collection");
      
      if (collectionId) {
        setSelectedCollectionId(collectionId);
        Promise.all([
          fetchBookmarks(collectionId),
          fetchFolders(collectionId)
        ]);
      } else if (data.length > 0) {
        const firstCollectionId = data[0].id;
        setSelectedCollectionId(firstCollectionId);
        router.push(`/admin/bookmarks?collection=${firstCollectionId}`);
        Promise.all([
          fetchBookmarks(firstCollectionId),
          fetchFolders(firstCollectionId)
        ]);
      }
    } catch (error) {
      console.error("Get collections failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async (collectionId: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        sortField,
        sortOrder,
        ...(currentFolderId ? { folderId: currentFolderId } : {})
      });
      
      const response = await fetch(
        `/api/admin/collections/${collectionId}/bookmarks?${queryParams}`
      );
      const data = await response.json();
      
      setBookmarks({
        currentBookmarks: data.currentBookmarks || [],
        subfolders: data.subfolders || []
      });
      
      setFolders(data.subfolders || []);

    } catch (error) {
      console.error("获取书签失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async (collectionId: string = selectedCollectionId) => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/folders?` +
        (currentFolderId ? `parentId=${currentFolderId}` : '')
      );
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Get folders failed:", error);
    }
  };

  const handleSortChange = async (field: any, order: any) => {
    setSortField(field);
    setSortOrder(order);
    
    if (selectedCollectionId) {
      await fetchBookmarks(selectedCollectionId);
    }
  };

  const handleFolderClick = async (folderId: string) => {
    try {
      setIsNavigating(true);
      setError(null);

      const pathResponse = await fetch(`/api/collections/${selectedCollectionId}/folders/${folderId}/path`);
      const pathData = await pathResponse.json();
      
      setCurrentFolderId(folderId);
      setFolderPath(pathData);

      const [bookmarksResponse, foldersResponse] = await Promise.all([
        fetch(
          `/api/collections/${selectedCollectionId}/bookmarks?` + 
          `sortField=${sortField}&sortOrder=${sortOrder}&folderId=${folderId}`
        ),
        fetch(
          `/api/collections/${selectedCollectionId}/folders?parentId=${folderId}`
        )
      ]);

      const [bookmarksData, foldersData] = await Promise.all([
        bookmarksResponse.json(),
        foldersResponse.json()
      ]);

      setBookmarks(bookmarksData);
      setFolders(foldersData);
    } catch (error) {
      setError("Failed to navigate to folder");
    } finally {
      setIsNavigating(false);
    }
  };

  const handleFolderBack = async (index: number) => {
    try {
      setIsNavigating(true);
      setError(null);

      let targetFolderId: string | undefined;
      let newPath: Array<{ id: string; name: string; parentId: string | null }>;

      if (index === -1) {
        targetFolderId = undefined;
        newPath = [];
      } else {
        newPath = folderPath.slice(0, index + 1);
        targetFolderId = newPath[newPath.length - 1]?.id;
      }

      setCurrentFolderId(targetFolderId);
      setFolderPath(newPath);

      const [bookmarksResponse, foldersResponse] = await Promise.all([
        fetch(
          `/api/collections/${selectedCollectionId}/bookmarks?` + 
          `sortField=${sortField}&sortOrder=${sortOrder}` +
          (targetFolderId ? `&folderId=${targetFolderId}` : '')
        ),
        fetch(
          `/api/collections/${selectedCollectionId}/folders?` +
          (targetFolderId ? `parentId=${targetFolderId}` : '')
        )
      ]);

      const [bookmarksData, foldersData] = await Promise.all([
        bookmarksResponse.json(),
        foldersResponse.json()
      ]);

      setBookmarks(bookmarksData);
      setFolders(foldersData);
    } catch (error) {
      setError("Navigate folder failed");
    } finally {
      setIsNavigating(false);
    }
  };

  const handleBookmarksChange = async () => {
    if (selectedCollectionId) {
      try {
        await Promise.all([
          fetchBookmarks(selectedCollectionId),
          fetchFolders(selectedCollectionId)
        ]);
      } catch (error) {
        console.error("Failed to refresh data:", error);
      }
    }
  };

  const LoadingSkeleton = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-[200px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-9 w-[60px]" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="rounded-lg border border-gray-200">
           <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <AdminHeader 
        title="Bookmarks"
        action={
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <Select
              value={selectedCollectionId}
              onValueChange={(value) => {
                setSelectedCollectionId(value);
                router.push(`/admin/bookmarks?collection=${value}`);
                Promise.all([
                  fetchBookmarks(value),
                  fetchFolders(value)
                ]);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections?.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsCreateFolderDialogOpen(true)}
                disabled={!selectedCollectionId || loading}
                variant="outline"
                size="sm"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={!selectedCollectionId || loading}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-hidden p-4 md:p-8 bg-card/50 flex flex-col">
        {loading ? (
          <div className="overflow-y-auto">
            <LoadingSkeleton />
          </div>
        ) : collections.length === 0 ? (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">No bookmark collections</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Please create a collection first.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* 顶部工具栏：面包屑导航 + 视图切换 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
              {/* 文件夹导航路径 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFolderBack(-1)}
                  className={!currentFolderId ? "bg-white dark:bg-gray-800" : ""}
                  disabled={isNavigating}
                >
                  Root
                </Button>
                {folderPath.map((folder, index) => (
                  <Fragment key={folder.id}>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFolderBack(index)}
                      className={currentFolderId === folder.id ? "bg-white dark:bg-gray-800" : ""}
                      disabled={isNavigating}
                    >
                      {folder.name}
                    </Button>
                  </Fragment>
                ))}
              </div>

              {/* 视图切换器 */}
              <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setViewMode('table')}
                >
                  <List className="w-3.5 h-3.5 mr-1.5" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'sort' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setViewMode('sort')}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  Sort
                </Button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-md border bg-background/50 shadow-sm p-1">
              {bookmarks.currentBookmarks.length === 0 && bookmarks.subfolders.length === 0 ? (
                 <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground">Current folder is empty.</p>
                      <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>Add your first bookmark</Button>
                    </div>
                 </div>
              ) : viewMode === 'table' ? (
                /* === 表格视图 === */
                <BookmarkDataTable 
                  collectionId={selectedCollectionId}
                  folders={folders}
                  bookmarks={bookmarks}
                  currentFolderId={currentFolderId}
                  onFolderClick={handleFolderClick}
                  onBookmarksChange={handleBookmarksChange}
                  loading={loading}
                  isNavigating={isNavigating}
                  // === 修复点：添加了类型断言 as ... ===
                  sortField={sortField as "createdAt" | "updatedAt"} 
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
              ) : (
                /* === 排序视图 (拖拽) === */
                <div className="p-6">
                   <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                      💡 提示：拖拽卡片来调整顺序。此操作会直接更新数据库中的排序权重。
                   </div>
                   <ContentManager 
                      initialFolders={folders}
                      initialBookmarks={bookmarks.currentBookmarks}
                   />
                </div>
              )}
            </div>
          </div>
        )}

        <CreateBookmarkDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          defaultCollectionId={selectedCollectionId}
          defaultFolderId={currentFolderId}
          onSuccess={() => {
            if (selectedCollectionId) {
              fetchBookmarks(selectedCollectionId);
              fetchFolders(selectedCollectionId);
            }
          }}
        />

        <CreateFolderDialog 
          open={isCreateFolderDialogOpen}
          onOpenChange={setIsCreateFolderDialogOpen}
          collectionId={selectedCollectionId}
          onSuccess={() => {
            if (selectedCollectionId) {
              fetchFolders(selectedCollectionId);
            }
          }}
        />
      </main>
    </div>
  );
}
