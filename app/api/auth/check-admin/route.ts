import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    return NextResponse.json({ isAdmin: admin });
  } catch (error) {
    console.error("[CheckAdmin] Error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

