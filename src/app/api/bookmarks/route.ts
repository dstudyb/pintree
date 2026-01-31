import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const skip = (page - 1) * pageSize;

    // 使用 Promise.all 并行执行查询
    const [total, bookmarks] = await Promise.all([
      // 获取总数
      prisma.bookmark.count(),
      // 获取分页数据
      prisma.bookmark.findMany({
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          icon: true,
          isFeatured: true,
          // ================= 修改点 1: 确保取出 sortOrder 字段 =================
          sortOrder: true, 
          // =================================================================
          createdAt: true,
          collection: {
            select: {
              name: true,
            },
          },
          folder: {
            select: {
              name: true,
            },
          },
        },
        skip,
        take: pageSize,
        // ================= 修改点 2: 默认按 sortOrder 升序排列 =================
        orderBy: [
          { sortOrder: 'asc' }, // 优先按自定义顺序排
          { updatedAt: 'desc' } // 其次按更新时间排
        ],
        // ====================================================================
      })
    ]);

    return NextResponse.json({
      bookmarks,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get bookmarks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, url, description, icon, collectionId, folderId, tags, isFeatured, sortOrder } = await request.json();

    // 验证必填字段
    if (!title || !url || !collectionId) {
      return NextResponse.json(
        { error: "Title, URL and collection are required" },
        { status: 400 }
      );
    }

    // 处理 folderId (处理 "none" 或 undefined 的情况)
    let effectiveFolderId = null;
    if (folderId && folderId !== "none") {
      // 验证文件夹是否存在且属于正确的集合
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
          collectionId: collectionId
        }
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Selected folder does not exist or does not belong to this collection" },
          { status: 400 }
        );
      }
      effectiveFolderId = folderId;
    }

    // ================= 修改点 3: 自动计算 sortOrder (排在最后) =================
    // 查找当前位置（同一个集合、同一个文件夹）下，序号最大的书签
    const lastBookmark = await prisma.bookmark.findFirst({
      where: {
        collectionId: collectionId,
        folderId: effectiveFolderId, // 确保只在同级查找
      },
      orderBy: {
        sortOrder: 'desc', // 倒序取第一个
      },
      select: {
        sortOrder: true,
      },
    });

    // 如果用户没传 sortOrder，则自动计算：最大序号 + 1
    const newSortOrder = sortOrder ?? ((lastBookmark?.sortOrder ?? -1) + 1);
    // ======================================================================

    // 创建书签的基础数据
    const bookmarkData = {
      title,
      url,
      description,
      icon,
      collectionId,
      isFeatured: isFeatured ?? false,
      sortOrder: newSortOrder, // 使用计算后的序号
      folderId: effectiveFolderId // 直接使用处理好的 folderId
    };

    const bookmark = await prisma.bookmark.create({
      data: bookmarkData,
      include: {
        collection: {
          select: {
            name: true,
          },
        },
        folder: {
          select: {
            name: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error("Failed to create bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark, please check all fields are correct" },
      { status: 500 }
    );
  }
}
