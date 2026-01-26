"use client";

import Link from "next/link";
import { CollectionsNav } from "@/components/collection/CollectionsNav"; // 引入您之前创建的组件
import { Github, Book } from "lucide-react"; // 引入图标
import { Button } from "@/components/ui/button";
import { Collection } from "@prisma/client";

interface SiteHeaderProps {
  collections: Collection[]; // 接收从 page.tsx 传来的数据
}

export function SiteHeader({ collections }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* 左侧：Logo 和 集合切换 */}
        <div className="mr-4 flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2 font-bold text-lg">
            <span>Pintree</span>
          </Link>
          
          {/* === 应用集合切换组件 === */}
          <CollectionsNav collections={collections} />
        </div>

        {/* 右侧：文档和 Github */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/docs" title="Documentation">
                <Book className="h-5 w-5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com/Pintree/pintree"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
              >
                <Github className="h-5 w-5 text-muted-foreground" />
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
