"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  Folder as FolderIcon,
  Film, Music, Gamepad2, Code2, Book, Image as ImageIcon, 
  Monitor, Globe, Coffee, Briefcase, GraduationCap, 
  ShoppingCart, Cloud
} from "lucide-react";
// ==============================================================

interface Folder {
  id: string;
  name: string;
  icon?: string;
  isPublic: boolean;
  password?: string;
  sortOrder: number;
  parentId?: string | null;
}

interface EditFolderDialogProps {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  collectionId: string;
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

export function EditFolderDialog({
  folder,
  open,
  onOpenChange,
  onSuccess,
  collectionId
}: EditFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  
  const initialFormData = {
    name: "",
    icon: "",
    isPublic: false,
    password: "",
    sortOrder: 0,
    parentId: "root"
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (collectionId) {
      fetchFolders();
    }
  }, [collectionId]);

  useEffect(() => {
    if (folder && open) {
      setFormData({
        name: folder.name || "",
        icon: folder.icon || "",
        isPublic: folder.isPublic || false,
        password: folder.password || "",
        sortOrder: typeof folder.sortOrder === 'number' ? folder.sortOrder : 0,
        parentId: folder.parentId || "root",
      });
    }
  }, [folder, open]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/folders`);
      const data = await response.json();
      setFolders(data.filter((f: Folder) => f.id !== folder.id));
    } catch (error) {
      console.error("Failed to get folders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId === "root" ? null : formData.parentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Update folder failed: ${response.status}`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Update folder failed:", error);
      alert(error instanceof Error ? error.message : "Update folder failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>
            Modify folder properties and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* ================= 修改点 3: 替换 Icon Input 为选择器 ================= */}
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
                  value={formData.icon || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="https://..." 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          {/* =================================================================== */}

          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) }))
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPublic: checked }))
              }
            />
            <Label>Public Access</Label>
          </div>

          {!formData.isPublic && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Set access password"
              />
            </div>
          )}

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
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
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
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
