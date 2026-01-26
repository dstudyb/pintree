import { NextResponse } from 'next/server';
import { createClient } from 'webdav';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, password, remotePath } = body;

    // 基础校验
    if (!url || !username || !password) {
      return NextResponse.json({ success: false, message: '请提供完整的连接信息' }, { status: 400 });
    }

    // 初始化 WebDAV 客户端
    const client = createClient(url, {
      username: username,
      password: password,
    });

    // 测试连接（尝试获取根目录内容，并设置 10s 超时）
    await Promise.race([
      client.getDirectoryContents('/'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('连接超时')), 10000))
    ]);

    // 检查目标路径是否存在（如果不存在则尝试创建文件夹）
    // remotePath 例如: /pintree/bookmarks.json -> 目录: /pintree
    const targetPath = remotePath.startsWith('/') ? remotePath : '/' + remotePath;
    const dirPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
    
    if (dirPath && dirPath !== '/') {
        if (!(await client.exists(dirPath))) {
            await client.createDirectory(dirPath);
        }
    }

    return NextResponse.json({ 
      success: true, 
      message: '连接测试成功，目录已就绪' 
    });

  } catch (error: any) {
    console.error('WebDAV Auth Error:', error);
    
    let errorMessage = '无法连接到 WebDAV 服务器';
    if (error.response?.status === 401) {
      errorMessage = '身份验证失败：请检查用户名或应用密码';
    } else if (error.message === '连接超时') {
      errorMessage = '连接超时：请检查 URL 或网络环境';
    }

    return NextResponse.json({ 
      success: false, 
      message: errorMessage 
    }, { status: 500 });
  }
}
