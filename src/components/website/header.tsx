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

// ================= 修改点 1: 引入 CollectionsNav 和 类型 =================
import { CollectionsNav } from "@/components/collection/CollectionsNav";
import { Collection } from "@prisma/client";
// ======================================================================

interface HeaderProps {
  selectedCollectionId?: string;
  currentFolderId?: string | null;
  onBookmarkAdded?: () => void;
  onCollectionChange?: (id: string) => void;
  // ================= 修改点 2: 新增 collections 属性 =================
  collections: Collection[];
  // ==================================================================
}

export function Header({ 
  selectedCollectionId, 
  currentFolderId, 
  onBookmarkAdded,
  onCollectionChange,
  // ================= 修改点 3: 解构 collections =================
  collections 
  // ============================================================
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
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* ================= 修改点 4: 在这里插入集合切换菜单 ================= */}
        <CollectionsNav collections={collections} />
        {/* ================================================================ */}
      </div>
      
      <div className="flex items-center gap-2">
        {session && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Bookmark
            </Button>
          </>
        )}
        <Button asChild variant="outline" size="sm">
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
