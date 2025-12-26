import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { PushNotificationService } from "@/server/services/push-notification.service";
import { z } from "zod";

const registerPushSchema = z.object({
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = registerPushSchema.parse(body);

    const userAgent = request.headers.get("user-agent") || undefined;

    // Store push subscription in database
    await PushNotificationService.storeSubscription(
      session.user.id,
      subscription,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push registration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to register push subscription",
      },
      { status: 400 }
    );
  }
}

// DELETE endpoint to remove subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = z.object({ endpoint: z.string() }).parse(body);

    await PushNotificationService.removeSubscription(endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unregistration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to remove push subscription",
      },
      { status: 400 }
    );
  }
}

