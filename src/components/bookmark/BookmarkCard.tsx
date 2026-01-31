"use client";

import Image from 'next/image'
import { useState } from 'react'
import { Folder, ExternalLink } from 'lucide-react'
import { cn } from "@/lib/utils" // 假设你有这个工具函数，如果没有，请看代码底部的注释

interface BookmarkCardProps {
  // 基础数据
  title: string
  url: string
  icon?: string | null // 数据库可能是 null
  description?: string | null
  isFeatured?: boolean
  
  // 关联信息
  collection?: {
    name: string
    slug: string
  }
  folder?: {
    name: string
  }

  // === 新增：交互与样式 ===
  onClick?: () => void
  className?: string
  showActionIcon?: boolean // 是否显示右上角跳转图标（可选）
}

export function BookmarkCard({
  title,
  url,
  icon,
  description,
  isFeatured = false,
  collection,
  folder,
  onClick,
  className,
  showActionIcon = false
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false)
  const defaultIcon = '/assets/default-icon.svg' // 确保你 public 目录下有这个文件
  
  // 清理 URL 显示
  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  // 处理点击逻辑
  const handleClick = () => {
    if (onClick) {
      // 如果传了 onClick (比如在 Admin 页)，执行它 (例如打开编辑弹窗)
      onClick()
    } else {
      // 否则默认行为：新标签页打开链接
      window.open(url, '_blank')
    }
  }
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer flex flex-col p-4 transition-all duration-200",
        "bg-card/50 dark:bg-gray-900 border border-[#eaebf3] dark:border-gray-800",
        "rounded-2xl hover:bg-card dark:hover:bg-gray-800 hover:shadow-md hover:border-blue-200 dark:hover:border-gray-700",
        isFeatured ? 'border-2 border-blue-500/50 shadow-sm' : '',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
            {/* 图标区域 */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg bg-background/50 p-1 border border-gray-100 dark:border-gray-800">
                <Image
                src={!imageError && icon ? icon : defaultIcon}
                alt={title}
                fill
                className="rounded-md object-contain p-0.5"
                onError={() => setImageError(true)}
                sizes="40px"
                />
            </div>
            
            {/* 标题和 URL */}
            <div className="flex flex-col overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight mb-0.5">
                    {title}
                </h3>
                <p className="text-[10px] text-gray-400 truncate font-mono">
                    {cleanUrl}
                </p>
            </div>
        </div>
        
        {/* 如果需要，显示一个外部链接小图标 */}
        {showActionIcon && !onClick && (
             <ExternalLink className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* 描述信息 */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 h-8 leading-relaxed">
          {description}
        </p>
      )}

      {/* 底部信息 (分类/文件夹) */}
      {(collection || folder) && (
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center text-[10px] text-gray-400">
          {collection && (
            <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
              {collection.name}
            </span>
          )}
          
          {collection && folder && <span className="mx-1.5 text-gray-300">/</span>}
          
          {folder && (
            <div className="flex items-center text-gray-500">
              <Folder className="w-3 h-3 mr-1" />
              <span>{folder.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
