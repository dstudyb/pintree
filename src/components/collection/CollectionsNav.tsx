"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Collection } from "@prisma/client";

interface CollectionsNavProps {
  collections: Collection[];
}

export function CollectionsNav({ collections }: CollectionsNavProps) {
  const searchParams = useSearchParams();
  const currentSlug = searchParams.get("collection");

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          {/* 修改点 1: 触发按钮也加上半透明效果，使其更融合 */}
          <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground hover:bg-accent/50 focus:bg-accent/50">
            Collections
          </NavigationMenuTrigger>
          
          {/* 修改点 2: 下拉菜单背景改为半透明毛玻璃 */}
          <NavigationMenuContent className="bg-background/80 backdrop-blur-md">
            <ul className="grid w-[300px] gap-2 p-2 md:w-[400px]">
              {collections.map((collection) => (
                <ListItem
                  key={collection.id}
                  title={collection.name}
                  href={`/?collection=${collection.slug}`}
                  className={cn(
                    // ================= 修改点 3: 选中状态改为半透明 + 毛玻璃 =================
                    // 原来是 "bg-accent"，现在改为 "bg-accent/60 backdrop-blur-sm"
                    currentSlug === collection.slug && "bg-accent/60 backdrop-blur-sm text-accent-foreground"
                    // =======================================================================
                  )}
                >
                  {collection.description || "No description provided."}
                </ListItem>
              ))}
              
              {collections.length === 0 && (
                 <div className="p-4 text-sm text-center text-muted-foreground">
                    No collections found.
                 </div>
              )}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// 1. 定义更严格的 Props 接口，强制 href 为 string
interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  href: string; // 显式声明 href 必填
  title: string;
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, children, href, ...props }, ref) => { // 解构出 href
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref as any}
            href={href} // 显式传递 href
            className={cn(
              // ================= 修改点 4: 悬停 (Hover) 状态也改为半透明 =================
              // 原来是 hover:bg-accent，现在改为 hover:bg-accent/50
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground",
              // =========================================================================
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
