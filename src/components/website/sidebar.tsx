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
// ================= 修改点 1: 引入更多 Lucide 图标 =================
import { 
  ChevronRight, 
  Folder, 
  FolderOpen,
  // 新增预设图标
  Film,       // 影视
  Music,      // 音乐
  Gamepad2,   // 游戏
  Code2,      // 代码/开发
  Book,       // 书籍/阅读
  Image as ImageIcon, // 图片 (重命名避免冲突)
  Monitor,    // 科技/设备
  Globe,      // 网络
  Coffee,     // 生活
  Briefcase,  // 工作
  GraduationCap // 学习
} from "lucide-react";
// ===============================================================
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingImages } from "@/hooks/useSettingImages";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ... (Collection 和 FolderNode 接口定义保持不变) ...
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

// ================= 修改点 2: 定义图标映射表 =================
// 键名就是您在数据库/文件夹设置里填写的字符串
const PREDEFINED_ICONS: Record<string, React.ComponentType<any>> = {
  "movie": Film,
  "film": Film,
  "music": Music,
  "game": Gamepad2,
  "code": Code2,
  "dev": Code2,
  "book": Book,
  "read": Book,
  "image": ImageIcon,
  "photo": ImageIcon,
  "tech": Monitor,
  "web": Globe,
  "life": Coffee,
  "work": Briefcase,
  "study": GraduationCap
};
// ==========================================================

export function WebsiteSidebar({
  onFolderSelect,
  onCollectionChange,
  selectedCollectionId,
  currentFolderId,
}: WebsiteSidebarProps) {
  // ... (状态和 Hooks 保持不变) ...
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { images, isLoading, error } = useSettingImages("logoUrl");

  // ... (useEffect fetchCollections 保持不变) ...
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/collections?publicOnly=true");
        const data = await response.json();

        if (!Array.isArray(data)) {
          setCollections([]);
          return;
        }

        setCollections(data);

        if (data.length > 0 && !selectedCollectionId) {
          if (onCollectionChange) {
            onCollectionChange(data[0].id);
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

  // ... (useEffect fetchFolders 保持不变) ...
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

  // ... (useEffect expandFolders 保持不变) ...
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

  // ... (buildFolderTree 保持不变) ...
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
    return folders.map((folder) => {
      // ================= 修改点 3: 获取对应的图标组件 =================
      // 如果 folder.icon 是预设的关键词（如 "movie"），则获取对应的组件
      const PredefinedIcon = folder.icon ? PREDEFINED_ICONS[folder.icon.toLowerCase()] : null;
      // ==============================================================

      return (
        <div key={folder.id}>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleFolderSelect(folder.id)}
              className={cn(
                "flex items-center w-full rounded-xl transition-all duration-200",
                "hover:bg-accent/40 active:bg-accent/50", 
                currentFolderId === folder.id 
                  ? "bg-accent/60 backdrop-blur-sm text-accent-foreground font-medium shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
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
                        currentFolderId === folder.id && "text-current"
                      )}
                      onClick={(e) => toggleFolder(folder.id, e)}
                    />
                  ) : (
                    <div className="w-4" />
                  )}
                  
                  {/* ================= 修改点 4: 渲染图标逻辑 ================= */}
                  {PredefinedIcon ? (
                    // 1. 如果是预设图标 (movie, code, etc.) -> 渲染 Lucide 组件
                    <PredefinedIcon 
                      className={cn(
                        "h-4 w-4 shrink-0",
                        currentFolderId === folder.id ? "text-current" : "text-muted-foreground" // 自动跟随颜色
                      )} 
                    />
                  ) : folder.icon ? (
                    // 2. 如果是 URL 图片 -> 渲染 img
                    <img
                      src={folder.icon}
                      alt={folder.name}
                      className="h-4 w-4 shrink-0 object-contain"
                    />
                  ) : (
                    // 3. 默认文件夹图标
                    expandedFolders.has(folder.id) ? (
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
                    )
                  )}
                  {/* ======================================================== */}

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
      );
    });
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
    <Sidebar className="flex flex-col h-screen bg-background/60 backdrop-blur-md border-r border-border/40">
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
