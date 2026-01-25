import { NextResponse } from 'next/server';
import { createClient } from 'webdav';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (!config?.url || !config?.username || !config?.password) {
      return NextResponse.json({ success: false, message: '配置缺失' }, { status: 400 });
    }

    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });

    // === 动作 A: 备份 (数据库 -> WebDAV) ===
    if (action === 'upload') {
      const allData = await prisma.collection.findMany({
        include: {
          folders: {
            include: {
              bookmarks: true
            }
          }
        }
      });

      const backupPayload = {
        meta: { version: '1.0', exportedAt: new Date().toISOString(), app: 'Pintree' },
        data: allData
      };
      
      await client.putFileContents(config.remotePath, JSON.stringify(backupPayload, null, 2));
      return NextResponse.json({ success: true, message: `成功备份 ${allData.length} 个集合到云端` });
    }

    // === 动作 B: 恢复 (WebDAV -> 数据库) ===
    if (action === 'download') {
      if (await client.exists(config.remotePath) === false) {
        return NextResponse.json({ success: false, message: '云端备份文件不存在' }, { status: 404 });
      }

      const fileBuffer = await client.getFileContents(config.remotePath);
      const jsonContent = JSON.parse(fileBuffer.toString());
      const collectionsToRestore = jsonContent.data;

      if (!Array.isArray(collectionsToRestore)) {
        return NextResponse.json({ success: false, message: '备份文件格式错误' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // 清空现有数据
        await tx.bookmark.deleteMany({});
        await tx.folder.deleteMany({});
        await tx.collection.deleteMany({});

        // 逐个恢复集合
        for (const col of collectionsToRestore) {
          await tx.collection.create({
            data: {
              id: col.id,
              name: col.name,
              slug: col.slug,
              isPublic: col.isPublic,
              createdAt: col.createdAt,
            }
          });

          const folders = col.folders || [];

          // 恢复 Folders (第一遍：只创建节点)
          for (const folder of folders) {
            await tx.folder.create({
              data: {
                id: folder.id,
                name: folder.name,
                collectionId: col.id,
                parentId: null, 
                createdAt: folder.createdAt,
              }
            });
          }

          // 恢复 Folders (第二遍：更新父子关系)
          for (const folder of folders) {
            if (folder.parentId) {
              await tx.folder.update({
                where: { id: folder.id },
                data: { parentId: folder.parentId }
              });
            }

            // 恢复 Bookmarks
            if (folder.bookmarks && folder.bookmarks.length > 0) {
              await tx.bookmark.createMany({
                data: folder.bookmarks.map((bm: any) => ({
                  id: bm.id,
                  title: bm.title,
                  url: bm.url,
                  icon: bm.icon,
                  desc: bm.desc,
                  folderId: folder.id,
                  collectionId: col.id, // <--- 关键修复：添加了 collectionId
                  createdAt: bm.createdAt,
                }))
              });
            }
          }
        }
      }, {
        maxWait: 10000,
        timeout: 20000 
      });

      return NextResponse.json({ success: true, message: '恢复成功，页面即将刷新' });
    }

    return NextResponse.json({ success: false, message: '无效的动作' }, { status: 400 });

  } catch (error: any) {
    console.error('WebDAV Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message || '同步出错' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
