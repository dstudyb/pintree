import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 确保路径正确，可能是 @/db 或 @/lib/db
import { auth } from "@/auth"; // 如果你有鉴权，加上这行

export async function PUT(req: Request) {
  try {
    // 1. 鉴权 (可选，建议加上)
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // 2. 获取数据
    const body = await req.json();
    const { items } = body; // items 结构应该是: [{ id: "xxx", sortOrder: 0 }, { id: "yyy", sortOrder: 1 }]

    if (!Array.isArray(items)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    // 3. 批量更新数据库 (使用事务)
    // 注意：Prisma 目前不支持直接 updateMany 设置不同的值，所以用事务循环更新
    await prisma.$transaction(
      items.map((item) =>
        prisma.folder.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REORDER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
