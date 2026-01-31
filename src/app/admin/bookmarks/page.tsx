"use client";

import { useState, useEffect, useCallback } from "react";
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

// === 类型定义 ===
interface Collection {
  id: string;
  name: string;
  slug: string;
}

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
  folder?: { name: string };
  collection?: { name: string; slug: string };
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

// 定义排序字段类型
type SortField = "createdAt" | "updatedAt" | "sortOrder";

export default function BookmarksPage() {
  // === 状态管理 ===
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "sort">("table");
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // 数据状态
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);
  
  // 内容状态
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<{ currentBookmarks: Bookmark[]; subfolders: Folder[] }>({
    currentBookmarks: [],
    subfolders: []
  });

  // 排序状态
  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const searchParams = useSearchParams();
  const router = useRouter();

  // === 核心逻辑：加载内容 ===
  // 这是一个通用的加载函数，用于获取指定集合、指定文件夹下的所有内容
  const loadContent = useCallback(async (collectionId: string, folderId?: string) => {
    if (!collectionId) return;
    
    // 如果是切换文件夹，标记为 navigating (不全屏 loading)；如果是初始加载，标记为 loading
    const isInit = loading; 
    if (!isInit) setIsNavigating(true);

    try {
      const queryParams = new URLSearchParams({
        sortField,
        sortOrder,
        ...(folderId ? { folderId } : {})
      });

      // 并行请求：书签数据 + 文件夹数据
      const [bookmarksRes, foldersRes] = await Promise.all([
        fetch(`/api/admin/collections/${collectionId}/bookmarks?${queryParams}`),
        fetch(`/api/collections/${collectionId}/folders?${folderId ? `parentId=${folderId}` : ''}`)
      ]);

      const bookmarksData = await bookmarksRes.json();
      const foldersData = await foldersRes.json();

      setBookmarks({
        currentBookmarks: bookmarksData.currentBookmarks || [],
        subfolders: bookmarksData.subfolders || []
      });
      setFolders(foldersData || []);

    } catch (error) {
      console.error("Failed to load content:", error);
    } finally {
      setLoading(false);
      setIsNavigating(false);
    }
  }, [sortField, sortOrder, loading]);

  // === 初始化 ===
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/collections");
        const data = await res.json();
        setCollections(data);

        const urlCollectionId = searchParams.get("collection");
        const targetId = urlCollectionId || data[0]?.id;

        if (targetId) {
          setSelectedCollectionId(targetId);
          if (!urlCollectionId) {
            router.replace(`/admin/bookmarks?collection=${targetId}`);
          }
          // 初始加载内容
          loadContent(targetId, undefined);
        } else {
          setLoading(false); // 没有集合的情况
        }
      } catch (error) {
        console.error("Init failed:", error);
        setLoading(false);
      }
    };
    init();
  }, []); // 只在组件挂载时执行一次

  // === 事件处理 ===

  // 切换集合
  const handleCollectionChange = (id: string) => {
    setSelectedCollectionId(id);
    setCurrentFolderId(undefined); // 重置文件夹
    setFolderPath([]); // 重置路径
    router.push(`/admin/bookmarks?collection=${id}`);
    setLoading(true); // 切换集合显示全屏 loading
    loadContent(id, undefined);
  };

  // 点击文件夹（进入下一级）
  const handleFolderClick = async (folderId: string) => {
    // 1. 获取路径信息
    const pathRes = await fetch(`/api/collections/${selectedCollectionId}/folders/${folderId}/path`);
    const pathData = await pathRes.json();
    
    setCurrentFolderId(folderId);
    setFolderPath(pathData);
    
    // 2. 加载新内容
    loadContent(selectedCollectionId, folderId);
  };

  // 面包屑导航（返回上一级）
  const handleFolderBack = (index: number) => {
    let targetId: string | undefined;
    let newPath: typeof folderPath = [];

    if (index !== -1) {
      newPath = folderPath.slice(0, index + 1);
      targetId = newPath[newPath.length - 1]?.id;
    }

    setCurrentFolderId(targetId);
    setFolderPath(newPath);
    loadContent(selectedCollectionId, targetId);
  };

  // 排序改变
  const handleSortChange = (field: SortField, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order);
    // 状态更新是异步的，所以这里直接传新值去加载，或者利用 useEffect 监听 sort 变化
    // 为了简单起见，利用 useEffect 监听 sort 变化可能会导致无限循环风险，
    // 这里我们手动触发一次刷新，但由于 React 批处理，直接调用 loadContent 可能拿不到最新 state。
    // 简单的做法是：让 loadContent 依赖 sortField，但这需要把 loadContent 放进 useEffect。
    // 鉴于目前架构，我们做一个简单的 hack：
    setTimeout(() => loadContent(selectedCollectionId, currentFolderId), 0);
  };
  
  // 刷新数据（用于创建/编辑后）
  const refreshData = () => loadContent(selectedCollectionId, currentFolderId);

  // 骨架屏组件
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex justify-between mb-6"><Skeleton className="h-10 w-[200px]" /><div className="flex gap-2"><Skeleton className="h-10 w-[120px]" /><Skeleton className="h-10 w-[120px]" /></div></div>
      <div className="flex gap-2 mb-4"><Skeleton className="h-9 w-[60px]" /><Skeleton className="h-9 w-[100px]" /></div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <AdminHeader 
        title="Bookmarks"
        action={
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <Select value={selectedCollectionId} onValueChange={handleCollectionChange}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select collection" /></SelectTrigger>
              <SelectContent>
                {collections.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateFolderDialogOpen(true)} disabled={!selectedCollectionId || loading} variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" /> New Folder
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!selectedCollectionId || loading} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Bookmark
              </Button>
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-hidden p-4 md:p-8 bg-card/50 flex flex-col">
        {loading ? (
          <div className="overflow-y-auto"><LoadingSkeleton /></div>
        ) : collections.length === 0 ? (
          <div className="flex h-full items-center justify-center border border-dashed rounded-md">
            <div className="text-center">
              <h3 className="font-semibold text-lg">No collections</h3>
              <p className="text-muted-foreground text-sm">Create a collection to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* 顶部栏：面包屑 + 视图切换 */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleFolderBack(-1)} className={!currentFolderId ? "bg-white dark:bg-gray-800" : ""} disabled={isNavigating}>Root</Button>
                {folderPath.map((folder, index) => (
                  <Fragment key={folder.id}>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    <Button variant="ghost" size="sm" onClick={() => handleFolderBack(index)} className={currentFolderId === folder.id ? "bg-white dark:bg-gray-800" : ""} disabled={isNavigating}>{folder.name}</Button>
                  </Fragment>
                ))}
              </div>

              <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('table')}>
                  <List className="w-3.5 h-3.5 mr-1.5" /> Table
                </Button>
                <Button variant={viewMode === 'sort' ? 'default' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('sort')}>
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Sort
                </Button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-md border bg-background/50 shadow-sm p-1">
              {bookmarks.currentBookmarks.length === 0 && bookmarks.subfolders.length === 0 ? (
                 <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Current folder is empty.</p>
                      <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>Add your first bookmark</Button>
                    </div>
                 </div>
              ) : viewMode === 'table' ? (
                <BookmarkDataTable 
                  collectionId={selectedCollectionId}
                  folders={folders}
                  bookmarks={bookmarks}
                  currentFolderId={currentFolderId}
                  onFolderClick={handleFolderClick}
                  onBookmarksChange={refreshData}
                  loading={loading}
                  isNavigating={isNavigating}
                  // 这里使用了类型断言来兼容 DataTable 组件
                  sortField={sortField as "createdAt" | "updatedAt"}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
              ) : (
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
          onSuccess={refreshData}
        />

        <CreateFolderDialog 
          open={isCreateFolderDialogOpen}
          onOpenChange={setIsCreateFolderDialogOpen}
          collectionId={selectedCollectionId}
          onSuccess={refreshData}
        />
      </main>
    </div>
  );
}
