"use client"

import * as React from "react"
import { GalleryVerticalEnd, Minus, Plus, RefreshCw } from "lucide-react" 
import { useState } from "react"
import { SearchForm } from "@/components/search-form"
import WebDAVSettings from "@/components/WebDAV/WebDAVSettings"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        { title: "Installation", url: "#" },
        { title: "Project Structure", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      items: [
        { title: "Basic Settings", url: "#" },
        { title: "SEO Settings", url: "#" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false)

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200/50 text-sidebar-primary-foreground">
                    <GalleryVerticalEnd className="size-4 text-slate-600" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-slate-200">PinTree</span>
                    <span className="text-slate-500 text-xs">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SearchForm />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item, index) => (
                <Collapsible key={item.title} defaultOpen={index === 1} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-slate-300 hover:text-white transition-colors">
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden text-slate-500" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden text-slate-500" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              // 修复点：删除了 isActive 属性，避免类型报错
                              className="text-slate-400 hover:text-slate-100 transition-colors"
                            >
                              <a href={subItem.url}>{subItem.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}

                        
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {isWebDAVOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsWebDAVOpen(false)} />
          <div className="relative w-full max-w-md shadow-2xl scale-95 animate-in zoom-in-95 duration-200">
            <WebDAVSettings onClose={() => setIsWebDAVOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
