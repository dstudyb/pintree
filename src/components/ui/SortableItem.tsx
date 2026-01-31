"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
    position: "relative" as const,
    touchAction: "none", // 优化移动端体验
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div
        {...attributes}
        {...listeners}
        // 样式微调：添加 backdrop-blur 让抓手更清晰
        className="absolute left-2 top-2 z-20 cursor-grab rounded-md bg-white/80 p-1 text-gray-500 opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:bg-black/50"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
}
