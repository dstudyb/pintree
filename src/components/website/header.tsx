"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Settings, LayoutGrid } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateBookmarkDialogGlobal from "@/components/bookmark/CreateBookmarkDialogGlobal";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";

import { CollectionsNav } from "@/components/collection/CollectionsNav";
import { Collection } from "@prisma/client";

interface HeaderProps {
  selectedCollectionId?: string;
  currentFolderId?: string | null;
  onBookmarkAdded?: () => void;
  onCollectionChange?: (id: string) => void;
  collections: Collection[];
}

export function Header({ 
  selectedCollectionId, 
  currentFolderId, 
  onBookmarkAdded,
  onCollectionChange,
  collections 
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = async (newBookmarkFolderId?: string) => {
    setDialogOpen(false);
    
    if (
      (newBookmarkFolderId && newBookmarkFolderId === currentFolderId) || 
      (!newBookmarkFolderId && !currentFolderId)
    ) {
      if (onBookmarkAdded) {
        await onBookmarkAdded();
      }
    }
    
    const targetFolderId = newBookmarkFolderId || currentFolderId;
    
    if (targetFolderId && targetFolderId !== currentFolderId) {
      const currentSearchParams = new URLSearchParams(searchParams.toString());
      currentSearchParams.set('folderId', targetFolderId);
      router.push(`${pathname}?${currentSearchParams.toString()}`);
    }
  };

  return (
    // ================= 修改点: 添加毛玻璃效果 (bg-background/60 backdrop-blur-md) =================
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/60 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10">
    {/* ========================================================================================= */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        <CollectionsNav collections={collections} />
      </div>
      
      <div className="flex items-center gap-2">
        {session && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDialogOpen(true)}
              // 稍微调整按钮样式以适应背景
              className="bg-background/50 hover:bg-accent/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Bookmark
            </Button>
          </>
        )}
        <Button asChild variant="outline" size="sm" className="bg-background/50 hover:bg-accent/50">
          <Link href="/admin/collections" aria-label="Admin">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <CreateBookmarkDialogGlobal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCollectionId={selectedCollectionId || ""}
        defaultFolderId={currentFolderId || undefined}
        onSuccess={handleSuccess}
      />
    </header>
  );
}
