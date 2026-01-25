import { NextResponse } from 'next/server';
import { createClient } from 'webdav';
import { PrismaClient } from '@prisma/client';

// 实例化 Prisma (通常建议从单例文件导入，这里为了方便直接实例化，或者使用你项目中现有的 @/lib/prisma)
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, config } = body; // 不需要前端传 data 了

    if (!config?.url || !config?.username || !config?.password) {
      return NextResponse.json({ success: false, message: '配置缺失' }, { status: 400 });
    }

    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });

    // === 动作 A: 备份 (数据库 -> WebDAV) ===
    if (action === 'upload') {
      console.log('开始执行备份...');
      
      // 1. 从数据库获取所有数据 (关联查询)
      // 我们导出 Collections，并包含下面的 Folders 和 Bookmarks
      const allData = await prisma.collection.findMany({
        include: {
          folders: {
            include: {
              bookmarks: true
            }
          }
        }
      });

      // 2. 构造备份文件内容 (增加元数据)
      const backupPayload = {
        meta: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          app: 'Pintree'
        },
        data: allData
      };
      
      const fileContent = JSON.stringify(backupPayload, null, 2);
      
      // 3. 写入 WebDAV
      await client.putFileContents(config.remotePath, fileContent);
      
      return NextResponse.json({ success: true, message: `成功备份 ${allData.length} 个集合到云端` });
    }

    // === 动作 B: 恢复 (WebDAV -> 数据库) ===
    // 注意：恢复逻辑比较复杂，通常涉及“清空重写”或“增量合并”。
    // 这里先实现“读取并返回给前端”，让用户确认。
    if (action === 'download') {
      if (await client.exists(config.remotePath) === false) {
        return NextResponse.json({ success: false, message: '云端备份文件不存在' }, { status: 404 });
      }

      const fileBuffer = await client.getFileContents(config.remotePath);
      const fileString = fileBuffer.toString();
      const jsonData = JSON.parse(fileString);

      return NextResponse.json({ success: true, data: jsonData, message: '下载成功' });
    }

    return NextResponse.json({ success: false, message: '无效的动作' }, { status: 400 });

  } catch (error: any) {
    console.error('WebDAV Sync Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '同步出错' },
      { status: 500 }
    );
  } finally {
    // 这里的 disconnect 在 Serverless 环境中可选，但为了规范可以加上
    await prisma.$disconnect();
  }
}
