"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

// 引入通用拖拽包装器
import { SortableItem } from "@/components/ui/sortable-item";

// 引入卡片组件
import { FolderCard } from "@/components/bookmark/FolderCard";
import { BookmarkCard } from "@/components/bookmark/BookmarkCard";

// === 类型定义 (防止 TypeScript 报错) ===
interface Folder {
  id: string;
  name: string;
  icon?: string | null;
  _count?: {
    bookmarks: number;
  };
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  description?: string | null;
  folder?: {
    name: string;
  } | null;
  collection?: {
    name: string;
    slug: string;
  } | null;
}

interface ContentManagerProps {
  initialFolders: Folder[];
  initialBookmarks: Bookmark[];
}

export function ContentManager({
  initialFolders,
  initialBookmarks,
}: ContentManagerProps) {
  // === 1. 状态管理 ===
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

  // 当 props 更新时同步状态
  useEffect(() => {
    setFolders(initialFolders);
    setBookmarks(initialBookmarks);
  }, [initialFolders, initialBookmarks]);

  // === 2. 传感器配置 ===
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // === 3. 文件夹拖拽处理 ===
  const handleFolderDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    const newFolders = arrayMove(folders, oldIndex, newIndex);

    setFolders(newFolders); // 立即更新 UI

    try {
      const updates = newFolders.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      await fetch("/api/folders/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });
    } catch (error) {
      toast.error("文件夹排序保存失败");
      setFolders(folders); // 回滚
    }
  };

  // === 4. 书签拖拽处理 ===
  const handleBookmarkDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = bookmarks.findIndex((b) => b.id === over.id);
    const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex);

    setBookmarks(newBookmarks);

    try {
      const updates = newBookmarks.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      await fetch("/api/bookmarks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });
    } catch (error) {
      toast.error("书签排序保存失败");
      setBookmarks(bookmarks);
    }
  };

  return (
    <div className="space-y-10">
      {/* === 文件夹区域 === */}
      {folders.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Folders</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFolderDragEnd}
            id="dnd-folders"
          >
            <SortableContext
              items={folders.map((f) => f.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {folders.map((folder) => (
                  <SortableItem key={folder.id} id={folder.id}>
                    <FolderCard
                      // 修复点：删除了 id={folder.id}，因为它导致报错
                      name={folder.name}
                      icon={folder.icon}
                      // 确保您已经更新了 FolderCard 组件以支持 itemCount
                      itemCount={folder._count?.bookmarks || 0}
                      onClick={() =>
                        (window.location.href = `/admin?folder=${folder.id}`)
                      }
                    />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* === 书签区域 === */}
      {bookmarks.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Bookmarks</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleBookmarkDragEnd}
            id="dnd-bookmarks"
          >
            <SortableContext
              items={bookmarks.map((b) => b.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((bookmark) => (
                  <SortableItem key={bookmark.id} id={bookmark.id}>
                    {/* 修复点：将属性拆开传递，而不是传 bookmark={bookmark} */}
                    <BookmarkCard
                      title={bookmark.title}
                      url={bookmark.url}
                      icon={bookmark.icon}
                      description={bookmark.description}
                      folder={bookmark.folder || undefined}
                      collection={bookmark.collection || undefined}
                      // 传入点击回调，覆盖默认的新窗口打开行为
                      onClick={() => {
                        console.log("Edit bookmark", bookmark.id);
                        toast.info(`编辑: ${bookmark.title}`);
                        // 这里以后可以改成 setIsEditDialogOpen(true)
                      }}
                    />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}
    </div>
  );
}
