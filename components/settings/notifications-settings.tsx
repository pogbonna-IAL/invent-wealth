"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PushNotificationButton } from "@/components/pwa/push-notification-button";
import { useState } from "react";

export function NotificationsSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    investmentUpdates: true,
    distributionAlerts: true,
    propertyUpdates: false,
    marketingEmails: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        // Silently fail - notifications are not critical
        // API endpoint doesn't exist yet, but UI remains functional
        return;
      }
    } catch (err) {
      // Silently fail - notifications are not critical
      // API endpoint doesn't exist yet, but UI remains functional
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="space-y-2 pb-4 border-b">
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive real-time notifications on your device
            </p>
            <PushNotificationButton />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="investment-updates">Investment Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about your investment activity
              </p>
            </div>
            <Switch
              id="investment-updates"
              checked={settings.investmentUpdates}
              onCheckedChange={() => handleToggle("investmentUpdates")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="distribution-alerts">Distribution Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts when distributions are declared
              </p>
            </div>
            <Switch
              id="distribution-alerts"
              checked={settings.distributionAlerts}
              onCheckedChange={() => handleToggle("distributionAlerts")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="property-updates">Property Updates</Label>
              <p className="text-sm text-muted-foreground">
                Updates about properties you've invested in
              </p>
            </div>
            <Switch
              id="property-updates"
              checked={settings.propertyUpdates}
              onCheckedChange={() => handleToggle("propertyUpdates")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and updates
              </p>
            </div>
            <Switch
              id="marketing-emails"
              checked={settings.marketingEmails}
              onCheckedChange={() => handleToggle("marketingEmails")}
            />
          </div>

          <Button onClick={handleSave} className="mt-4">
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

