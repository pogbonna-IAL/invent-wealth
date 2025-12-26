import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { PushNotificationService } from "@/server/services/push-notification.service";
import { z } from "zod";

const sendNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  sendToAll: z.boolean().optional().default(false),
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  url: z.string().optional(),
  requireInteraction: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can send push notifications
    await requireAdmin(session.user.id);

    const body = await request.json();
    const data = sendNotificationSchema.parse(body);

    const payload = {
      title: data.title,
      body: data.body,
      icon: data.icon || "/invent-alliance-logo-small.svg",
      badge: data.badge || "/invent-alliance-logo-small.svg",
      tag: data.tag,
      data: {
        url: data.url || "/dashboard",
      },
      requireInteraction: data.requireInteraction,
    };

    let result;

    if (data.sendToAll) {
      // Send to all subscribed users
      result = await PushNotificationService.sendToAll(payload);
    } else if (data.userIds && data.userIds.length > 0) {
      // Send to specific users
      result = await PushNotificationService.sendToUsers(data.userIds, payload);
    } else {
      // Send to current user only
      result = await PushNotificationService.sendToUser(session.user.id, payload);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send notification",
      },
      { status: 400 }
    );
  }
}

