import { NextResponse } from 'next/server';
import { createClient } from 'webdav';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, config, data } = body;
    // config 包含: url, username, password, remotePath

    if (!config?.url || !config?.username || !config?.password) {
      return NextResponse.json({ success: false, message: '配置缺失' }, { status: 400 });
    }

    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });

    // === 动作 A: 上传 (备份到云端) ===
    if (action === 'upload') {
      if (!data) {
        return NextResponse.json({ success: false, message: '没有数据可上传' }, { status: 400 });
      }
      
      // 将 JSON 对象转为字符串
      const fileContent = JSON.stringify(data, null, 2);
      
      // 写入 WebDAV
      await client.putFileContents(config.remotePath, fileContent);
      
      return NextResponse.json({ success: true, message: '上传成功' });
    }

    // === 动作 B: 下载 (从云端恢复) ===
    if (action === 'download') {
      // 检查文件是否存在
      if (await client.exists(config.remotePath) === false) {
        return NextResponse.json({ success: false, message: '云端文件不存在' }, { status: 404 });
      }

      // 读取文件
      const fileBuffer = await client.getFileContents(config.remotePath);
      // 处理 Buffer 转 String
      const fileString = fileBuffer.toString();
      
      try {
        const jsonData = JSON.parse(fileString);
        return NextResponse.json({ success: true, data: jsonData, message: '下载成功' });
      } catch (e) {
        return NextResponse.json({ success: false, message: '云端文件损坏，无法解析为 JSON' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, message: '无效的动作' }, { status: 400 });

  } catch (error: any) {
    console.error('WebDAV Sync Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '同步出错' },
      { status: 500 }
    );
  }
}
