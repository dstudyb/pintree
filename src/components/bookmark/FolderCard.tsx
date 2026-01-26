"use client";

// ================= 修改点 1: 引入 Lucide 图标 =================
import { 
  Folder, 
  Film, Music, Gamepad2, Code2, Book, Image as ImageIcon, 
  Monitor, Globe, Coffee, Briefcase, GraduationCap, 
  ShoppingCart, Cloud 
} from "lucide-react";
// =======================================================

interface FolderCardProps {
  name: string;
  icon?: string;
  onClick: () => void;
}

// ================= 修改点 2: 定义图标映射表 =================
const PREDEFINED_ICONS: Record<string, React.ComponentType<any>> = {
  "movie": Film, "film": Film,
  "music": Music,
  "game": Gamepad2,
  "code": Code2, "dev": Code2,
  "book": Book, "read": Book,
  "image": ImageIcon, "photo": ImageIcon,
  "tech": Monitor,
  "web": Globe,
  "life": Coffee,
  "work": Briefcase,
  "study": GraduationCap,
  "shop": ShoppingCart, "buy": ShoppingCart,
  "cloud": Cloud, "server": Cloud
};
// ==========================================================

export function FolderCard({ name, icon, onClick }: FolderCardProps) {
  // ================= 修改点 3: 解析图标逻辑 =================
  const rawIcon = icon || "";
  const iconKey = rawIcon.trim().toLowerCase();
  const PredefinedIcon = iconKey ? PREDEFINED_ICONS[iconKey] : null;
  // ========================================================

  return (
    <button
      onClick={onClick}
      className="p-4 bg-muted/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-muted dark:hover:bg-gray-800 transition-colors w-full"
    >
      <div className="flex flex-row items-center gap-4">
        {/* ================= 修改点 4: 渲染不同类型的图标 ================= */}
        {PredefinedIcon ? (
          // 1. 预设关键词图标 (如 movie)
          // text-blue-500 可以让特殊图标稍微显眼一点，或者改回 text-gray-400 保持统一
          <PredefinedIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
        ) : rawIcon && (rawIcon.startsWith("http") || rawIcon.startsWith("/")) ? (
          // 2. 图片链接 URL
          <img src={rawIcon} alt={name} className="w-12 h-12 object-contain" />
        ) : (
          // 3. 默认图标 (使用 SVG 或 Lucide Folder)
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
        {/* =============================================================== */}
        
        <span className="text-sm truncate">{name}</span>
      </div>
    </button>
  );
}
