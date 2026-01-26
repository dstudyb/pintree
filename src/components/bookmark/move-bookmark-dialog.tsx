"use client";

import { useState, useEffect } from "react";
import { FolderInput, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { moveBookmark, getFolderOptions } from "@/actions/bookmarks";

interface MoveBookmarkDialogProps {
  bookmarkId: string;
  currentFolderId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // 如果作为 DropdownMenuItem 使用，我们需要特殊处理
  asDropdownItem?: boolean; 
  // ================= 修改点 1: 添加 onSuccess 回调定义 =================
  onSuccess?: () => void;
  // ===================================================================
}

export function MoveBookmarkDialog({
  bookmarkId,
  currentFolderId,
  asDropdownItem = false,
  // ================= 修改点 2: 解构 onSuccess =================
  onSuccess,
  // =========================================================
}: MoveBookmarkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string; collection: { name: string } }[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(currentFolderId || "root");
  const [fetchingFolders, setFetchingFolders] = useState(false);

  // 当弹窗打开时获取文件夹列表
  useEffect(() => {
    if (open) {
      setFetchingFolders(true);
      getFolderOptions()
        .then((data) => setFolders(data))
        .catch(() => toast.error("Failed to load folders"))
        .finally(() => setFetchingFolders(false));
    }
  }, [open]);

  const handleMove = async () => {
    setLoading(true);
    try {
      const result = await moveBookmark(bookmarkId, selectedFolder);
      if (result.success) {
        toast.success("Bookmark moved successfully");
        setOpen(false);
        // ================= 修改点 3: 移动成功后调用 onSuccess =================
        if (onSuccess) {
          onSuccess();
        }
        // ====================================================================
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to move bookmark");
    } finally {
      setLoading(false);
    }
  };

  // 按集合对文件夹进行分组
  const groupedFolders = folders.reduce((acc, folder) => {
    const collectionName = folder.collection.name;
    if (!acc[collectionName]) {
      acc[collectionName] = [];
    }
    acc[collectionName].push(folder);
    return acc;
  }, {} as Record<string, typeof folders>);

  const Content = (
    <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
      <DialogHeader>
        <DialogTitle>Move Bookmark</DialogTitle>
        <DialogDescription>
          Select a new folder for this bookmark.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Select
            disabled={fetchingFolders || loading}
            value={selectedFolder}
            onValueChange={setSelectedFolder}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="root">
                <span className="text-muted-foreground italic">Root (No Folder)</span>
              </SelectItem>
              
              {Object.entries(groupedFolders).map(([collectionName, items]) => (
                <SelectGroup key={collectionName}>
                  <SelectLabel>{collectionName}</SelectLabel>
                  {items.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleMove} disabled={loading || fetchingFolders}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Move
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (asDropdownItem) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            {/* ================= 修改点 4: 删除了图标，只保留文字 ================= */}
            Move to Folder
            {/* ================================================================ */}
          </DropdownMenuItem>
        </DialogTrigger>
        {Content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FolderInput className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      {Content}
    </Dialog>
  );
}
