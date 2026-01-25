import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from 'webdav';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url, username, password, remotePath } = req.body;

  // 2. 基础校验
  if (!url || !username || !password) {
    return res.status(400).json({ message: '请提供完整的连接信息' });
  }

  try {
    // 3. 初始化 WebDAV 客户端
    const client = createClient(url, {
      username: username,
      password: password,
    });

    // 4. 测试连接（尝试获取根目录内容，并设置 10s 超时）
    // 我们检查服务器是否可达，且账号是否有权限
    await Promise.race([
      client.getDirectoryContents('/'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('连接超时')), 10000))
    ]);

    // 5. 检查目标路径是否存在（如果不存在则尝试创建文件夹）
    // 这一步是高级程序员的防御性编程
    const dirPath = remotePath.substring(0, remotePath.lastIndexOf('/'));
    if (!(await client.exists(dirPath))) {
      await client.createDirectory(dirPath);
    }

    return res.status(200).json({ 
      success: true, 
      message: '连接测试成功，且同步目录已就绪' 
    });

  } catch (error: any) {
    console.error('WebDAV Auth Error:', error);
    
    // 6. 针对性错误提示
    let errorMessage = '无法连接到 WebDAV 服务器';
    if (error.response?.status === 401) {
      errorMessage = '身份验证失败：请检查用户名或应用密码';
    } else if (error.message === '连接超时') {
      errorMessage = '连接超时：请检查 URL 或网络环境（大陆 VPS 访问境外服务器可能受限）';
    }

    return res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
}
