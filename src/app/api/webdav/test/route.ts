import { NextResponse } from 'next/server';
import { createClient } from 'webdav';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, password, remotePath } = body;

    if (!url || !username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供完整的连接信息' },
        { status: 400 }
      );
    }

    // 初始化 WebDAV 客户端
    const client = createClient(url, {
      username: username,
      password: password,
    });

    // 测试连接（尝试获取根目录内容）
    // 设置 10s 超时防止请求挂起
    await Promise.race([
      client.getDirectoryContents('/'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('连接超时')), 10000))
    ]);

    // 检查/创建目标目录
    // 注意：remotePath 可能是 "/pintree/bookmarks.json"
    // 我们只需要确保 "/pintree/" 存在
    if (remotePath && remotePath.includes('/')) {
        const dirPath = remotePath.substring(0, remotePath.lastIndexOf('/'));
        if (dirPath && !(await client.exists(dirPath))) {
             await client.createDirectory(dirPath);
        }
    }

    return NextResponse.json({ 
      success: true, 
      message: '连接测试成功，目录已就绪' 
    });

  } catch (error: any) {
    console.error('WebDAV Connection Error:', error);
    
    let errorMessage = '无法连接到 WebDAV 服务器';
    if (error.response?.status === 401) {
      errorMessage = '身份验证失败：用户名或密码错误';
    } else if (error.message === '连接超时') {
      errorMessage = '连接超时：请检查服务器地址是否可达';
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
