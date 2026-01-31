"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner"; // 假设你使用 sonner 做提示
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
  rectSortingStrategy, // 网格布局排序策略
  verticalListSortingStrategy, // 列表布局排序策略(如果你书签是单列显示用这个)
} from "@dnd-kit/sortable";

// 引入通用拖拽包装器 (我们之前创建的)
import { SortableItem } from "@/components/ui/sortable-item";

// 引入你的卡片组件 (假设你有这些组件)
import { FolderCard } from "@/components/bookmark/FolderCard";
// 如果没有书签卡片，下面我会给你一个简单的示例
import { BookmarkCard } from "@/components/bookmark/BookmarkCard"; 

interface ContentManagerProps {
  initialFolders: any[];
  initialBookmarks: any[];
}

export function ContentManager({ initialFolders, initialBookmarks }: ContentManagerProps) {
  // === 1. 状态管理 ===
  const [folders, setFolders] = useState(initialFolders);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);

  // 当 props 更新时（比如切换了父目录），同步更新状态
  useEffect(() => {
    setFolders(initialFolders);
    setBookmarks(initialBookmarks);
  }, [initialFolders, initialBookmarks]);

  // === 2. 传感器配置 ===
  // 必须按住移动 8px 才会触发拖拽，防止点击事件(onClick)失效
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // === 3. 文件夹拖拽处理 ===
  const handleFolderDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 乐观更新：先在前端立即交换位置
    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    const newFolders = arrayMove(folders, oldIndex, newIndex);
    
    setFolders(newFolders); // 立即渲染新顺序

    // 发送请求给后端
    try {
      const updates = newFolders.map((item, index) => ({
        id: item.id,
        sortOrder: index, // 用新的数组下标作为 sortOrder
      }));

      await fetch("/api/folders/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });
      // 可以不弹 toast，无感保存体验更好
    } catch (error) {
      toast.error("文件夹排序保存失败");
      setFolders(folders); // 失败回滚
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
            id="dnd-folders" // 唯一ID避免冲突
          >
            <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {folders.map((folder) => (
                  <SortableItem key={folder.id} id={folder.id}>
                    <FolderCard
                      // 传递你的 FolderCard 需要的 props
                     
                      name={folder.name}
                      icon={folder.icon}
                      itemCount={folder._count?.bookmarks || 0}
                      // 只有这里点击才跳转，拖拽不会触发点击
                      onClick={() => window.location.href = `/admin?folder=${folder.id}`}
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
            <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((bookmark) => (
                  <SortableItem key={bookmark.id} id={bookmark.id}>
                    <BookmarkCard 
                       bookmark={bookmark} 
                       // 这里可以传 onEdit, onDelete 等回调
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
