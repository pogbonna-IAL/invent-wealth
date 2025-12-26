import { prisma } from "@/server/db/prisma";
import webpush from "web-push";

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@inventwealth.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushNotificationService {
  /**
   * Store push subscription for a user
   */
  static async storeSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    userAgent?: string
  ) {
    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update existing subscription
      return prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
        },
      });
    }

    // Create new subscription
    return prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });
  }

  /**
   * Remove push subscription
   */
  static async removeSubscription(endpoint: string) {
    return prisma.pushSubscription.delete({
      where: { endpoint },
    });
  }

  /**
   * Get all subscriptions for a user
   */
  static async getUserSubscriptions(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
    });
  }

  /**
   * Send push notification to a single subscription
   */
  static async sendNotification(
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );

      return true;
    } catch (error: any) {
      console.error("Push notification error:", error);

      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        try {
          await this.removeSubscription(subscription.endpoint);
        } catch (deleteError) {
          console.error("Error removing invalid subscription:", deleteError);
        }
      }

      return false;
    }
  }

  /**
   * Send push notification to a user (all their subscriptions)
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload) {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        this.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.length - sent;

    return { sent, failed, total: subscriptions.length };
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    const totalSent = results.reduce(
      (sum, r) => (r.status === "fulfilled" ? sum + r.value.sent : sum),
      0
    );
    const totalFailed = results.reduce(
      (sum, r) => (r.status === "fulfilled" ? sum + r.value.failed : sum),
      0
    );

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * Send push notification to all subscribed users
   */
  static async sendToAll(payload: PushNotificationPayload) {
    const allSubscriptions = await prisma.pushSubscription.findMany();

    if (allSubscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      allSubscriptions.map((sub) =>
        this.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.length - sent;

    return { sent, failed, total: allSubscriptions.length };
  }
}

