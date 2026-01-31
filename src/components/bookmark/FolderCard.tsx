"use client";

import { Folder } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface FolderCardProps {
  name: string;
  icon?: string | null; // 允许 null，兼容数据库
  itemCount?: number;   // 新增：支持显示书签数量
  onClick: () => void;
}

export function FolderCard({ name, icon, itemCount = 0, onClick }: FolderCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white/50 p-6 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700 dark:hover:bg-gray-800"
    >
      {/* 图标区域 */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50/50 text-blue-500 dark:bg-blue-900/20">
        {!imageError && icon ? (
          <Image
            src={icon}
            alt={name}
            fill
            className="object-contain p-2"
            onError={() => setImageError(true)}
          />
        ) : (
          <Folder size={24} className="transition-transform group-hover:scale-110" />
        )}
      </div>

      {/* 文字区域 */}
      <div className="text-center">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {name}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
    </button>
  );
}
