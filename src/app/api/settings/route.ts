import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const runtime = 'nodejs';
// 增加超时时间到最大值
export const maxDuration = 60; // Vercel Hobby 允许的最大时间是 60 秒
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    
    // 获取所有设置
    const settings = group 
      ? await prisma.siteSetting.findMany({ where: { group } })
      : await prisma.siteSetting.findMany();

    // 将设置转换为键值对格式
    const formattedSettings = settings.reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.value || '';
      return acc;
    }, {});

    // 合并默认值和数据库值
    const result = {
      ...formattedSettings,
      enableSearch: true
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ 
      error: 'Failed to get settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Please login" }, { status: 401 });
    }

    const data = await request.json();
    // console.log('接收到的数据:', data);

    try {
      const updatedSettings = [];

      for (const [key, value] of Object.entries(data)) {
        // === 修改开始：使用 upsert 替代 update ===
        // 这样可以处理新添加的 WebDAV 配置项，而不仅仅是更新已有的
        const updated = await prisma.siteSetting.upsert({
          where: { key }, // 查找条件
          update: { 
            value: String(value) 
          },
          create: { 
            key, 
            value: String(value),
            // group 是必填项，如果不确定属于哪个组，可以归类为 'system' 或 'webdav'
            // 这里假设默认给 'system'，或者您可以根据 key 前缀判断
            group: key.startsWith('webdav_') ? 'webdav' : 'system' 
          }
        });
        updatedSettings.push(updated);
        // === 修改结束 ===
      }

      return NextResponse.json({ 
        message: 'Settings saved', 
        results: updatedSettings 
      });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Failed to save settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
