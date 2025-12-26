"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const requestPermission = async () => {
      if (!("Notification" in window)) {
        alert("Your browser doesn't support notifications");
        return false;
      }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const subscribeToPush = async () => {
    setIsLoading(true);
    try {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        alert("Please enable notifications in your browser settings");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("VAPID public key is not configured");
      }
      const keyArray = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray as unknown as BufferSource,
      });

      // Send subscription to server
      const response = await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error("Failed to register subscription");
      }

      setIsSubscribed(true);
      alert("Notifications enabled! You'll receive push notifications for important updates.");
    } catch (error) {
      console.error("Push subscription error:", error);
      alert("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        try {
          await fetch("/api/push/register", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        } catch (err) {
          console.error("Failed to remove subscription from server:", err);
        }
        
        setIsSubscribed(false);
        alert("Notifications disabled. You won't receive push notifications anymore.");
      }
    } catch (error) {
      console.error("Push unsubscription error:", error);
      alert("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
      disabled={isLoading}
    >
      {isSubscribed ? (
        <>
          <Bell className="mr-2 h-4 w-4" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="mr-2 h-4 w-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

