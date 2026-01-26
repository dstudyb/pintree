import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic";

// GET: 获取背景设置和透明度
export async function GET() {
  try {
    // 并行获取两个设置
    const [bgSetting, opacitySetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "main_background" } }),
      prisma.systemSetting.findUnique({ where: { key: "main_background_opacity" } })
    ]);

    return NextResponse.json({ 
      url: bgSetting?.value || "",
      // 如果数据库没有存，默认透明度为 85 (即 0.85)
      opacity: opacitySetting?.value ? parseInt(opacitySetting.value) : 85 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch background settings" }, { status: 500 });
  }
}

// POST: 保存背景设置和透明度
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, opacity } = await request.json();

    // 使用事务同时更新两个设置
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "main_background" },
        update: { value: url },
        create: { 
          key: "main_background", 
          value: url,
          description: "Main website background image URL"
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: "main_background_opacity" },
        update: { value: String(opacity) },
        create: { 
          key: "main_background_opacity", 
          value: String(opacity),
          description: "Main website background opacity (0-100)"
        },
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
