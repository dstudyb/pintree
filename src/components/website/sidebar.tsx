"use client";

import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingImages } from "@/hooks/useSettingImages";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ... (接口定义保持不变) ...
interface Collection {
  id: string;
  name: string;
  isPublic: boolean;
  slug: string;
}

interface FolderNode {
  id: string;
  name: string;
  icon?: string;
  level: number;
  children: FolderNode[];
}

interface WebsiteSidebarProps {
  onFolderSelect?: (folderId: string | null) => void;
  onCollectionChange?: (collectionId: string) => void;
  selectedCollectionId: string;
  currentFolderId: string | null;
}

export function WebsiteSidebar({
  onFolderSelect,
  onCollectionChange,
  selectedCollectionId,
  currentFolderId,
}: WebsiteSidebarProps) {
  // ... (Hooks 和 useEffect 逻辑完全保持不变) ...
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { images, isLoading, error } = useSettingImages("logoUrl");

  // ... (fetchCollections useEffect 保持不变) ...
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/collections?publicOnly=true");
        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error("API returned data format is incorrect");
          setCollections([]);
          return;
        }

        const publicCollections = data;
        setCollections(publicCollections);

        if (publicCollections.length > 0 && !selectedCollectionId) {
          const firstCollection = publicCollections[0];
          if (onCollectionChange) {
            onCollectionChange(firstCollection.id);
          }
        }
      } catch (error) {
        console.error("Get bookmark collection failed:", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  // ... (fetchFolders useEffect 保持不变) ...
  useEffect(() => {
    if (selectedCollectionId) {
      const fetchFolders = async () => {
        try {
          const response = await fetch(
            `/api/collections/${selectedCollectionId}/folders?all=true`
          );
          const data = await response.json();
          setFolders(data);
          setFolderTree(buildFolderTree(data));
        } catch (error) {
          console.error("Get folders failed:", error);
        }
      };
      fetchFolders();
    }
  }, [selectedCollectionId]);

  // ... (expandFolders useEffect 保持不变) ...
  useEffect(() => {
    if (currentFolderId && folders.length > 0) {
      const expandParentFolders = (folderId: string) => {
        const folder = folders.find((f) => f.id === folderId);
        if (folder && folder.parentId) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.add(folder.parentId!);
            return next;
          });
          expandParentFolders(folder.parentId);
        }
      };

      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(currentFolderId);
        return next;
      });

      expandParentFolders(currentFolderId);
    }

    const rootFolders = folders.filter(folder => !folder.parentId);
    if(!currentFolderId && rootFolders.length === 1) {
      setExpandedFolders(new Set([rootFolders[0].id]));
    }
  }, [currentFolderId, folders]);

  // ... (buildFolderTree 函数保持不变) ...
  const buildFolderTree = (folders: any[]): FolderNode[] => {
    const folderMap = new Map();
    folders.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        level: 0,
        path: [],
      });
    });

    const calculateLevel = (folderId: string, visited = new Set<string>()): number => {
      if (visited.has(folderId)) return 0;
      const folder = folderMap.get(folderId);
      if (!folder) return 0;
      if (folder.level !== 0) return folder.level;
      visited.add(folderId);
      if (!folder.parentId) {
        folder.level = 0;
      } else {
        folder.level = calculateLevel(folder.parentId, visited) + 1;
      }
      visited.delete(folderId);
      return folder.level;
    };

    folders.forEach((folder) => {
      calculateLevel(folder.id);
    });

    const rootFolders: FolderNode[] = [];
    folders.forEach((folder) => {
      const node = folderMap.get(folder.id);
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolderTree = (folders: FolderNode[]) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleFolderSelect(folder.id)}
            // ================= 修改点 1: 优化选中样式 =================
            // 移除 bg-gray-200/50，改为更通用的 hover/active 样式
            // 选中状态使用 bg-accent/60 backdrop-blur-sm (与顶部导航栏一致)
            className={cn(
              "flex items-center w-full rounded-xl transition-all duration-200",
              "hover:bg-accent/40 active:bg-accent/50", 
              currentFolderId === folder.id 
                ? "bg-accent/60 backdrop-blur-sm text-accent-foreground font-medium shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            // =========================================================
            style={{
              paddingLeft: `${folder.level * 5 + 12}px`,
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center w-8">
                {folder.children.length > 0 ? (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      expandedFolders.has(folder.id) && "rotate-90",
                      // 移除特定颜色，让其继承父级颜色
                      currentFolderId === folder.id && "text-current"
                    )}
                    onClick={(e) => toggleFolder(folder.id, e)}
                  />
                ) : (
                  <div className="w-4" />
                )}
                {expandedFolders.has(folder.id) ? (
                  <FolderOpen
                    className={cn(
                      "h-4 w-4 shrink-0 fill-current",
                      currentFolderId === folder.id && "text-current"
                    )}
                  />
                ) : (
                  <Folder
                    className={cn(
                      "h-4 w-4 shrink-0 fill-current",
                      currentFolderId === folder.id && "text-current"
                    )}
                  />
                )}
              </div>
              <span className="truncate">
                {folder.name}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {expandedFolders.has(folder.id) && folder.children.length > 0 && (
          <div>{renderFolderTree(folder.children)}</div>
        )}
      </div>
    ));
  };

  const handleFolderSelect = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder) {
      const hasChildren = folders.some((f) => f.parentId === folderId);
      if (hasChildren) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          if (next.has(folderId)) {
            next.delete(folderId);
          } else {
            next.add(folderId);
          }
          return next;
        });
      }
    }

    if (onFolderSelect) {
      onFolderSelect(folderId);
    } else {
      const currentSearchParams = new URLSearchParams(searchParams.toString());
      currentSearchParams.set("folderId", folderId);
      router.push(`${pathname}?${currentSearchParams.toString()}`, {
        scroll: false,
      });
    }
  };

  const SidebarSkeleton = () => {
    return (
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  };

  return (
    // ================= 修改点 2: 侧边栏容器样式优化 =================
    // 移除 bg-[#F9F9F9]，改为 bg-background/60 backdrop-blur-md 以支持毛玻璃效果
    // 添加 border-r border-border/40 让边缘更柔和
    <Sidebar className="flex flex-col h-screen bg-background/60 backdrop-blur-md border-r border-border/40">
    {/* ================================================================ */}
      <SidebarHeader className="flex-shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent rounded-none pr-0"
              >
                <Link
                  href="/"
                  className="pl-0 flex items-center gap-2 justify-start rounded-none pr-0 w-full h-[60px]"
                >
                  {isLoading ? (
                    <Skeleton className="w-[260px] h-[60px]" />
                  ) : (
                    <Image
                      src={images[0]?.url || "/logo.png"}
                      alt="Logo"
                      width={260}
                      height={60}
                      style={{
                        objectFit: "contain",
                      }}
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <SidebarGroup>
          <SidebarMenu>
            {loading ? (
              <SidebarSkeleton />
            ) : folderTree.length > 0 ? (
              renderFolderTree(folderTree)
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-sm text-muted-foreground space-y-2">
                <Folder className="h-8 w-8 opacity-50" />
                <span>No folders yet</span>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>{" "}
    </Sidebar>
  );
}
