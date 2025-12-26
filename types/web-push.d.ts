declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  interface WebPush {
    setVapidDetails(
      subject: string,
      publicKey: string,
      privateKey: string
    ): void;
    sendNotification(
      subscription: PushSubscription,
      payload: string | Buffer,
      options?: {
        TTL?: number;
        headers?: Record<string, string>;
        vapidDetails?: {
          subject: string;
          publicKey: string;
          privateKey: string;
        };
        contentEncoding?: "aes128gcm" | "aesgcm";
        urgency?: "very-low" | "low" | "normal" | "high";
        topic?: string;
      }
    ): Promise<SendResult>;
    generateVAPIDKeys(): {
      publicKey: string;
      privateKey: string;
    };
  }

  const webpush: WebPush;
  export default webpush;
}

