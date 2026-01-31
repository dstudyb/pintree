import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, icon, isPublic, password, collectionId, parentId } = await request.json();

    // 验证必填字段
    if (!name || !collectionId) {
      return NextResponse.json(
        { error: "Name and collection are required" },
        { status: 400 }
      );
    }

    // 如果指定了parentId,验证父文件夹是否存在且属于同一个集合
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { 
          id: parentId,
          collectionId: collectionId
        }
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder does not exist or does not belong to this collection" },
          { status: 400 }
        );
      }
    }

    // ================= 修改点 1: 计算新的 sortOrder =================
    // 查找当前层级下，sortOrder 最大的那个文件夹
    const lastFolder = await prisma.folder.findFirst({
      where: {
        collectionId: collectionId,
        parentId: parentId || null, // 确保只在同级查找
      },
      orderBy: {
        sortOrder: 'desc', // 按倒序排，取第一个就是最大的
      },
      select: {
        sortOrder: true,
      },
    });

    // 新的序号 = 最大序号 + 1。如果没找到(是第一个文件夹)，则设为 0
    const newSortOrder = (lastFolder?.sortOrder ?? -1) + 1;
    // =============================================================

    const folder = await prisma.folder.create({
      data: {
        name,
        icon,
        isPublic,
        password,
        collectionId,
        parentId: parentId || null,
        // ================= 修改点 2: 写入计算好的 sortOrder =================
        sortOrder: newSortOrder,
        // =================================================================
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
