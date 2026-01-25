"use client" // 声明为客户端组件以使用 useState 和交互功能

import * as React from "react"
import { 
  GalleryVerticalEnd, 
  Minus, 
  Plus, 
  RefreshCw // 使用更通用的 RefreshCw 图标，避免 CloudSync 在旧版本中报错
} from "lucide-react" 
import { useState } from "react"

import { SearchForm } from "@/components/search-form"
import WebDAVSettings from "@/components/WebDAV/WebDAVSettings" // 引入你创建的配置面板组件
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

/**
 * 侧边栏示例数据
 * 修改了 title 为 "Settings"，以便在循环中精确定位插入位置
 */
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
      title: "Settings", // 此处的 title 必须与下方判断语句一致
      url: "#",
      items: [
        { title: "Basic Settings", url: "#" },
        { title: "SEO Settings", url: "#" },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        { title: "Accessibility", url: "#" },
        { title: "Fast Refresh", url: "#" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 控制 WebDAV 配置弹窗显示状态的变量
  const [isWebDAVOpen, setIsWebDAVOpen] = useState(false)

  return (
    <>
      <Sidebar {...props}>
        {/* 侧边栏头部：Logo 和版本号 */}
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

        {/* 侧边栏主体内容 */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item, index) => (
                <Collapsible
                  key={item.title}
                  defaultOpen={index === 1} // 默认展开第二个分组 (Settings)
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {/* 父级菜单标题 */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-slate-300 hover:text-white transition-colors">
                        {item.title}{" "}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden text-slate-500" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden text-slate-500" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* 子菜单列表 */}
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

                        {/* --- 业务逻辑注入点 --- */}
                        {/* 当遍历到 Settings 组时，在末尾插入自定义的 WebDAV 同步按钮 */}
                        {item.title === "Settings" && (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                              onClick={() => setIsWebDAVOpen(true)}
                              className="cursor-pointer text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-2"
                            >
                              <RefreshCw className="size-3.5" /> {/* 添加小图标增强视觉引导 */}
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

      {/* --- 全局配置弹窗 (Modal) --- */}
      {/* 这里的 z-[100] 确保弹窗层级高于侧边栏 */}
      {isWebDAVOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          {/* 点击背景区域关闭弹窗 */}
          <div className="absolute inset-0" onClick={() => setIsWebDAVOpen(false)} />
          
          <div className="relative w-full max-w-md shadow-2xl scale-95 animate-in zoom-in-95 duration-200">
            {/* 传递 onClose 回调给组件，以便组件内部的关闭按钮生效 */}
            <WebDAVSettings onClose={() => setIsWebDAVOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
