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
          {/* 触发器按钮样式可根据 Header 背景色调整 */}
          <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground focus:bg-accent/50">
            Collections
          </NavigationMenuTrigger>
          
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-2 p-2 md:w-[400px]">
              {collections.map((collection) => (
                <ListItem
                  key={collection.id}
                  title={collection.name}
                  href={`/?collection=${collection.slug}`}
                  className={cn(
                    currentSlug === collection.slug && "bg-accent text-accent-foreground"
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

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref as any}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
});
ListItem.displayName = "ListItem";
