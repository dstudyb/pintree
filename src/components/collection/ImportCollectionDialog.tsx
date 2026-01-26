"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createFlattenBookmarks } from "@/lib/utils/import-extension-data";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Textarea } from "@/components/ui/textarea";

interface ImportCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportCollectionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null,
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setFormData((prev) => ({
        ...prev,
        file: acceptedFiles[0],
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    onError: (error) => {
      console.log(error);
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "file-too-large"
      ) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select a JSON file smaller than 5MB",
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file and enter a collection name",
      });
      return;
    }

    setLoading(true);

    try {
      const fileContent = await formData.file.text();
      const jsonData = JSON.parse(fileContent);

      // Batch import logic
      let batchSize = 100; // Process 100 bookmarks per batch

      let importedCollectionId = null;
      let folderMap: { [key: string]: string }[] = [];

      const startTime = Date.now();

      // ================= 修改点 1: 更智能的 Pintree 格式检测 =================
      // 只要包含 "Pintree" 字样，或者同时拥有 folders 和 bookmarks 结构，就认为是专用格式
      const isPintreeFormat = 
        jsonData.metadata?.exportedFrom?.includes("Pintree") || 
        (jsonData.folders && jsonData.bookmarks && !Array.isArray(jsonData.folders));

      if (isPintreeFormat) {
        // ... Pintree 专用导入逻辑 (Marks-export.json 将走这里) ...
        batchSize = 50
        // Import folders first
        const folderLevels = Object.keys(jsonData.folders)
          .map(Number)
          .sort((a, b) => a - b);

        for (const level of folderLevels) {
          const folderBatches = jsonData.folders[level];

          for (const folderBatch of folderBatches) {
            const folderRequestData = {
              name: formData.name,
              description: formData.description,
              folders: folderBatch,
              collectionId: importedCollectionId, // Will be null for the first batch
              folderMap: folderMap, // Pass existing folder mapping
            };

            const folderResponse: any = await fetch(
              "/api/collections/import-recover-data/recover-folders",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(folderRequestData),
              }
            );

            const folderData: any = await folderResponse.json();

            if (!folderResponse.ok) {
              toast({
                variant: "destructive",
                title: "Folder Import Failed",
                description: folderData.error || "An error occurred while importing folders",
              });
              return;
            }

            // Update collectionId and folderMap
            if (!importedCollectionId) {
              importedCollectionId = folderData.collectionId;
            }
            folderMap = folderData.insideFolderMap;

            // Show folder import progress
            toast({
              title: "Folder Import Progress",
              description: `Importing folders at level ${level}: Batch ${folderBatches.indexOf(folderBatch) + 1}/${folderBatches.length}`,
            });
          }
        }

        // Batch import bookmarks 
        const totalBookmarks = jsonData.bookmarks.length;
        for (let i = 0; i < totalBookmarks; i += batchSize) {
          const batchStartTime = Date.now();
          const batchBookmarks = jsonData.bookmarks.slice(i, i + batchSize);
       
          const requestData = {
            bookmarks: batchBookmarks,
            collectionId: importedCollectionId, 
            folderMap: folderMap, 
          };
       
          const response: any = await fetch("/api/collections/import-recover-data/recover-bookmarks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          });
       
          const data: any = await response.json();
          const batchEndTime = Date.now();
          const batchDuration = (batchEndTime - batchStartTime) / 1000; // seconds
          const remainingBatches = Math.ceil((totalBookmarks - i - batchSize) / batchSize);
          const estimatedRemainingTime = batchDuration * remainingBatches;
       
          if (!response.ok) {
            toast({
              variant: "destructive",
              title: "Bookmark Import Failed",
              description: data.message || "Failed to import bookmark collection",
            });
            return;
          }
       
          // Show import progress
          toast({
            title: "Bookmark Import Progress",
            description: `Imported ${Math.min(i + batchSize, totalBookmarks)}/${totalBookmarks} bookmarks 
              (${batchDuration.toFixed(2)}s, estimated remaining ${estimatedRemainingTime.toFixed(2)}s)`,
          });
        } 
      } else {
        // ================= 修改点 2: 通用解析 + LiteMark 支持 =================
        let rootNodes: any[] = [];

        // 检测 LiteMark / Category 扁平格式 (litemark-backup.json 将走这里)
        if (jsonData.bookmarks && Array.isArray(jsonData.bookmarks) && jsonData.bookmarks.length > 0 && jsonData.bookmarks[0].category) {
            console.log("Detected LiteMark/Category flat format. Transforming...");
            
            const categoryMap = new Map<string, any[]>();
            
            jsonData.bookmarks.forEach((item: any) => {
                const cat = item.category || "Uncategorized";
                if (!categoryMap.has(cat)) {
                    categoryMap.set(cat, []);
                }
                categoryMap.get(cat)?.push({
                    title: item.title,
                    name: item.title, // 确保有 name
                    url: item.url,
                    icon: item.icon,
                    description: item.description,
                    addDate: Date.now(),
                });
            });

            // 转换为树形结构
            rootNodes = Array.from(categoryMap.entries()).map(([catName, items]) => ({
                title: catName,
                name: catName,
                children: items
            }));
        } 
        // 否则使用通用递归查找 (Chrome/Edge 备份)
        else {
            const findBookmarkNodes = (obj: any): any[] => {
              if (!obj) return [];
              
              if (Array.isArray(obj)) {
                const looksLikeBookmarks = obj.some(item => 
                  item && (item.url || item.children || item.title || item.name)
                );
                if (looksLikeBookmarks) {
                  return obj;
                }
                for (const item of obj) {
                   const found = findBookmarkNodes(item);
                   if (found.length > 0) return found;
                }
              } else if (typeof obj === 'object') {
                if (obj.children && Array.isArray(obj.children) && obj.children.length > 0) return obj.children;
                if (obj.roots?.bookmark_bar?.children) return obj.roots.bookmark_bar.children;
                
                for (const key in obj) {
                  if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const found = findBookmarkNodes(obj[key]);
                    if (found.length > 0) return found;
                  }
                }
              }
              return [];
            };
            
            rootNodes = findBookmarkNodes(jsonData);
        }

        console.log("Parsed Root Nodes:", rootNodes);

        // 使用工具函数扁平化树结构
        const flattenedBookmarks = createFlattenBookmarks(rootNodes || []);

        const totalBookmarks = flattenedBookmarks.length;

        if (totalBookmarks === 0) {
            toast({
              variant: "destructive",
              title: "Import Error",
              description: "No bookmarks found. Please check the file format.",
            });
            return;
        }

        for (let i = 0; i < totalBookmarks; i += batchSize) {
          const batchStartTime = Date.now();
          const batchBookmarks = flattenedBookmarks.slice(i, i + batchSize);

          const requestData = {
            name: formData.name,
            description: formData.description,
            bookmarks: batchBookmarks,
            collectionId: importedCollectionId,
            folderMap: folderMap,
          };

          const response: any = await fetch("/api/collections/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          });

          const data: any = await response.json();
          const batchEndTime = Date.now();
          const batchDuration = (batchEndTime - batchStartTime) / 1000;
          const remainingBatches = Math.ceil(
            (totalBookmarks - i - batchSize) / batchSize
          );
          const estimatedRemainingTime = batchDuration * remainingBatches;

          console.log(`Batch imported`, data);

          toast({
            title: "Import Progress",
            description: `Batch ${Math.floor(i / batchSize) + 1} imported (${batchDuration.toFixed(2)}s).`,
          });

          if (!response.ok) {
            toast({
              variant: "destructive",
              title: "Import Failed",
              description: data.message || "Failed to import collection",
            });
            return;
          }

          if (i === 0) {
            importedCollectionId = data.collectionId;
          }

          if (data.insideFolderMap) {
            folderMap = [...data.insideFolderMap];
          }
        }
      }

      const totalImportTime = (Date.now() - startTime) / 1000;

      onOpenChange(false);
      router.refresh();

      setFormData({
        name: "",
        description: "",
        file: null,
      });

      toast({
        title: "Import Successful",
        description: `Collection "${formData.name}" imported successfully in ${totalImportTime.toFixed(2)}s`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to import bookmark collection:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Bookmark Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter collection name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value.slice(0, 140),
                }))
              }
              placeholder="Enter collection description"
              rows={3}
              className="resize-none"
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Select JSON File (Max 5MB)</Label>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 cursor-pointer
                hover:border-primary/50 transition-colors
                ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  {formData.file ? (
                    <span className="text-foreground font-medium">
                      {formData.file.name}
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">Click to upload</span> or
                      drag and drop file here
                      <p className="text-xs">Supports JSON files</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
