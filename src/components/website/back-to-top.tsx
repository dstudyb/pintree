"use client";

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. 定义接口：告诉 TypeScript 这个组件接受什么参数
interface BackToTopProps {
  scrollContainerId?: string; // 可选参数
}

// 2. 在组件参数里解构出 scrollContainerId
export function BackToTop({ scrollContainerId }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 3. 核心逻辑：判断是监听 window 还是监听具体的 div
    const getTarget = () => {
      if (scrollContainerId) {
        return document.getElementById(scrollContainerId);
      }
      return window;
    };

    const target = getTarget();
    if (!target) return;

    const toggleVisibility = () => {
      let scrollTop = 0;
      
      if (scrollContainerId && target instanceof HTMLElement) {
         // 如果是 div，读取 scrollTop
         scrollTop = target.scrollTop;
      } else {
         // 如果是 window，读取 scrollY
         scrollTop = window.scrollY;
      }

      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    target.addEventListener('scroll', toggleVisibility);
    return () => target.removeEventListener('scroll', toggleVisibility);
  }, [scrollContainerId]);

  const scrollToTop = () => {
    const target = scrollContainerId ? document.getElementById(scrollContainerId) : window;
    
    if (scrollContainerId && target instanceof HTMLElement) {
      target.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 right-8 p-3 rounded-full bg-black/80 text-white", // 可以根据需要改回 bg-primary
        "hover:bg-black transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
        "z-50 backdrop-blur-sm",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
