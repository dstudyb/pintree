import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// ================= 修改点 1: 引入图标和工具函数 =================
import { cn } from "@/lib/utils";
import { 
  Folder as FolderIcon, // 重命名避免与接口冲突
  Film, Music, Gamepad2, Code2, Book, Image as ImageIcon, 
  Monitor, Globe, Coffee, Briefcase, GraduationCap, 
  ShoppingCart, Cloud
} from "lucide-react";
// ==============================================================

interface Folder {
  id: string;
  name: string;
}

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentFolderId?: string;
  onSuccess?: () => void;
}

// ================= 修改点 2: 定义图标预设列表 =================
const ICON_PRESETS = [
  { id: "movie", icon: Film, label: "影视" },
  { id: "music", icon: Music, label: "音乐" },
  { id: "game", icon: Gamepad2, label: "游戏" },
  { id: "code", icon: Code2, label: "代码" },
  { id: "book", icon: Book, label: "书籍" },
  { id: "image", icon: ImageIcon, label: "图片" },
  { id: "tech", icon: Monitor, label: "科技" },
  { id: "web", icon: Globe, label: "网页" },
  { id: "life", icon: Coffee, label: "生活" },
  { id: "work", icon: Briefcase, label: "工作" },
  { id: "study", icon: GraduationCap, label: "学习" },
  { id: "shop", icon: ShoppingCart, label: "购物" },
  { id: "cloud", icon: Cloud, label: "云端" },
];
// ==========================================================

export function CreateFolderDialog({
  open,
  onOpenChange,
  collectionId,
  currentFolderId,
  onSuccess
}: CreateFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    // ================= 修改点 3: 初始化 icon 字段 =================
    icon: "", 
    // ===========================================================
    isPublic: true,
    password: "",
    parentId: currentFolderId || "root",
  });

  // 获取当前集合的所有文件夹
  useEffect(() => {
    if (collectionId) {
      fetchFolders();
    }
  }, [collectionId]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/folders`);
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to get folder.", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          collectionId,
          parentId: formData.parentId === "root" ? null : formData.parentId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create");
      }

      onOpenChange(false);
      onSuccess?.();
      
      setFormData({
        name: "",
        icon: "", // 重置 icon
        isPublic: true,
        password: "",
        parentId: currentFolderId || "",
      });
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ================= 修改点 5: 添加滚动和高度限制，解决显示不全的问题 ================= */}
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto hide-scrollbar">
      {/* ============================================================================== */}
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* ================= 修改点 4: 添加图标选择器 ================= */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="p-3 border rounded-md bg-muted/20">
              <div className="grid grid-cols-6 gap-2 mb-3">
                {ICON_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setFormData(prev => ({ ...prev, icon: preset.id }))}
                    className={cn(
                      "cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:bg-muted bg-background",
                      formData.icon === preset.id 
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary" 
                        : "border-muted-foreground/20 text-muted-foreground"
                    )}
                    title={preset.label}
                  >
                    <preset.icon className="h-5 w-5" />
                  </div>
                ))}
                {/* 清除/默认按钮 */}
                <div
                    onClick={() => setFormData(prev => ({ ...prev, icon: "" }))}
                    className={cn(
                      "cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:bg-muted bg-background",
                      !formData.icon ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-muted-foreground/20"
                    )}
                    title="Default"
                >
                    <FolderIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Or URL:</span>
                <Input 
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="movie, game, or https://..." 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          {/* ======================================================== */}

          <div className="space-y-2">
            <Label>Parent Folder</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, parentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Parent Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
