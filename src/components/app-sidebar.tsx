"use client" // 确保是客户端组件

import * as React from "react"
import { GalleryVerticalEnd, Minus, Plus, CloudSync } from "lucide-react" // 引入图标
import { useState } from "react"

import { SearchForm } from "@/components/search-form"
import WebDAVSettings from "@/components/WebDAV/WebDAVSettings" // 引入配置组件
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

// 示例数据
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
      title: "Settings", // 将原来的标题改为 Settings 匹配你的图片
      url: "#",
      items: [
        { title: "Basic Settings", url: "#" },
        { title: "SEO Settings", url: "#" },
      ],
    },
    // ... 其他数据保持不变
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
                <Collapsible
                  key={item.title}
                  defaultOpen={index === 1} // 默认展开 Settings
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-slate-300 hover:text-white">
                        {item.title}{" "}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                              className="text-slate-400 hover:text-slate-100 transition-colors"
                            >
                              <a href={subItem.url}>{subItem.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}

                        {/* 如果是 Settings 组，则额外插入 WebDAV 按钮 */}
                        {item.title === "Settings" && (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              onClick={() => setIsWebDAVOpen(true)}
                              className="cursor-pointer text-slate-400 hover:text-slate-100 transition-colors"
                            >
                              <span>WebDAV Settings</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )}
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

      {/* WebDAV 配置弹窗 */}
      {isWebDAVOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md shadow-2xl scale-95 animate-in zoom-in-95 duration-200">
            <WebDAVSettings onClose={() => setIsWebDAVOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
