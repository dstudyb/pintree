"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

// 移动书签
export async function moveBookmark(bookmarkId: string, newFolderId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Unauthorized");
    }

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        folderId: newFolderId === "root" ? null : newFolderId, // "root" 代表根目录
      },
    });

    revalidatePath("/admin/bookmarks");
    revalidatePath("/admin/collections");
    return { success: true };
  } catch (error) {
    console.error("Failed to move bookmark:", error);
    return { success: false, error: "Failed to move bookmark" };
  }
}

// 获取简化的文件夹列表（用于下拉选择）
export async function getFolderOptions() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    // 获取所有文件夹
    const folders = await prisma.folder.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        collection: {
          select: { name: true } // 同时获取所属集合名称，方便区分
        }
      }
    });

    return folders;
  } catch (error) {
    return [];
  }
}
