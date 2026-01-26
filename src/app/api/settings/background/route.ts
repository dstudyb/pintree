import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const dynamic = "force-dynamic";

// GET: /api/settings/background
export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "main_background" },
    });

    return NextResponse.json({ 
      url: setting?.value || "" 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch background" }, { status: 500 });
  }
}

// POST: /api/settings/background
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    const setting = await prisma.systemSetting.upsert({
      where: { key: "main_background" },
      update: { 
        value: url,
        description: "Main website background image URL"
      },
      create: { 
        key: "main_background", 
        value: url,
        description: "Main website background image URL"
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save background" }, { status: 500 });
  }
}
