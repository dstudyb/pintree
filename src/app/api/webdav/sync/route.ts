import { NextResponse } from 'next/server';
import { createClient } from 'webdav';
import { prisma } from '@/lib/prisma'; // 建议使用单例，如果没有请改成 import { PrismaClient } ... const prisma = new PrismaClient()

// Vercel 配置：增加超时时间，防止网络慢导致中断
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// === 1. 支持 GET 请求 (用于 Vercel Cron 自动定时备份) ===
export async function GET(request: Request) {
  // 1. 安全校验 (可选，建议本地调试时注释掉，上线时开启)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 2. === 新增：检查开关状态 ===
  const autoSyncSetting = await prisma.siteSetting.findUnique({
    where: { key: 'webdav_autosync' }
  });

  // 如果数据库里没记录，或者值为 "false"，则跳过备份
  if (!autoSyncSetting || autoSyncSetting.value !== 'true') {
    return NextResponse.json({ 
      success: true, 
      message: 'Skipped: Auto-sync is disabled in settings.' 
    });
  }

  // 3. 开关已开启，执行上传
  return handleSync('upload', null);
}

// === 2. 支持 POST 请求 (用于前端手动操作) ===
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, config } = body;
    return handleSync(action || 'upload', config);
  } catch (e) {
    return NextResponse.json({ success: false, message: '请求格式错误' }, { status: 400 });
  }
}

// === 核心同步逻辑 ===
async function handleSync(action: string, manualConfig: any) {
  try {
    let config = manualConfig;

    // A. 如果没有传入配置，尝试从数据库读取 (实现免密/自动同步)
    if (!config || !config.url) {
      const settings = await prisma.siteSetting.findMany({
        where: {
          key: { in: ['webdav_url', 'webdav_username', 'webdav_password', 'webdav_path'] }
        }
      });
      
      // 转换格式: db_key => config_key
      const settingsMap = settings.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      if (settingsMap.webdav_url) {
        config = {
          url: settingsMap.webdav_url,
          username: settingsMap.webdav_username,
          password: settingsMap.webdav_password,
          remotePath: settingsMap.webdav_path || '/pintree.json'
        };
      }
    }

    // B. 校验配置
    if (!config?.url || !config?.username || !config?.password) {
      return NextResponse.json({ success: false, message: 'WebDAV 配置缺失，请先在设置中保存' }, { status: 400 });
    }

    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });

    // === 动作: 备份 (Upload) - 含自动轮替逻辑 ===
    if (action === 'upload') {
      // 1. 获取所有数据
      const allData = await prisma.collection.findMany({
        include: { folders: { include: { bookmarks: true } } }
      });

      const backupPayload = {
        meta: { version: '1.0', exportedAt: new Date().toISOString(), app: 'Pintree' },
        data: allData
      };
      
      const jsonContent = JSON.stringify(backupPayload, null, 2);

      // 2. 路径处理
      // 确保路径以 / 开头
      const targetPath = config.remotePath.startsWith('/') ? config.remotePath : '/' + config.remotePath;
      // 获取所在目录 (例如 /backups/)
      const baseDir = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
      
      // 3. 上传带时间戳的备份 (pintree_backup_2024-01-01_12-00.json)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFilename = `${baseDir === '/' ? '' : baseDir}/pintree_backup_${timestamp}.json`.replace('//', '/');
      
      await client.putFileContents(backupFilename, jsonContent);

      // 4. 同时更新主文件 (覆盖 pintree.json，保证前端读取到最新)
      await client.putFileContents(targetPath, jsonContent);

      // 5. === 自动清理旧备份 (只保留最近3个) ===
      try {
        const directoryItems = await client.getDirectoryContents(baseDir);
        
        // 筛选出备份文件并按时间倒序排列
        const backups = (directoryItems as any[])
          .filter(item => item.basename.startsWith('pintree_backup_') && item.type === 'file')
          .sort((a, b) => {
             return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
          });

        // 如果超过3个，删除旧的
        if (backups.length > 3) {
          const toDelete = backups.slice(3); // 保留前3个，删除剩下的
          for (const file of toDelete) {
            await client.deleteFile(file.filename);
            console.log(`[Auto Clean] Deleted old backup: ${file.filename}`);
          }
        }
      } catch (cleanError) {
        console.warn('Backup cleanup warning:', cleanError);
        // 清理失败不影响主流程返回成功
      }

      return NextResponse.json({ 
        success: true, 
        message: `备份成功 (包含历史轮替，保留最新3份)` 
      });
    }

    // === 动作 B: 恢复 (WebDAV -> 数据库) ===
    if (action === 'download') {
      if (await client.exists(config.remotePath) === false) {
        return NextResponse.json({ success: false, message: 'WebDAV 上找不到目标文件' }, { status: 404 });
      }

      const fileBuffer = await client.getFileContents(config.remotePath);
      const jsonContent = JSON.parse(fileBuffer.toString());
      const collectionsToRestore = jsonContent.data;

      if (!Array.isArray(collectionsToRestore)) {
        return NextResponse.json({ success: false, message: '备份文件格式错误' }, { status: 400 });
      }

      // 事务恢复
      await prisma.$transaction(async (tx) => {
        // 清空现有数据
        await tx.bookmark.deleteMany({});
        await tx.folder.deleteMany({});
        await tx.collection.deleteMany({});

        // 逐个恢复
        for (const col of collectionsToRestore) {
          await tx.collection.create({
            data: {
              id: col.id, name: col.name, slug: col.slug, isPublic: col.isPublic, createdAt: col.createdAt,
            }
          });

          const folders = col.folders || [];

          // 第一遍：创建文件夹节点
          for (const folder of folders) {
            await tx.folder.create({
              data: {
                id: folder.id, name: folder.name, collectionId: col.id, parentId: null, createdAt: folder.createdAt,
              }
            });
          }

          // 第二遍：更新父子关系 & 插入书签
          for (const folder of folders) {
            if (folder.parentId) {
              await tx.folder.update({ where: { id: folder.id }, data: { parentId: folder.parentId } });
            }

            if (folder.bookmarks && folder.bookmarks.length > 0) {
              await tx.bookmark.createMany({
                data: folder.bookmarks.map((bm: any) => ({
                  id: bm.id,
                  title: bm.title,
                  url: bm.url,
                  icon: bm.icon,
                  
                  // =========== 核心修复点 ===========
                  // 数据库字段名是 description，而不是 desc
                  description: bm.description || bm.desc || "", 
                  // =================================
                  
                  folderId: folder.id,
                  collectionId: col.id,
                  createdAt: bm.createdAt,
                }))
              });
            }
          }
        }
      }, { maxWait: 10000, timeout: 20000 });

      return NextResponse.json({ success: true, message: '恢复成功' });
    }

    return NextResponse.json({ success: false, message: '无效的动作' }, { status: 400 });

  } catch (error: any) {
    console.error('WebDAV Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message || '同步出错' }, { status: 500 });
  }
  // 注意：在 Next.js Serverless 中，如果是导入的单例 prisma，通常不需要手动 disconnect
}
