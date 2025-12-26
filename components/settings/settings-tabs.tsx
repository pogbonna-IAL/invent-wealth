"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "./profile-settings";
import { NotificationsSettings } from "./notifications-settings";
import { SecuritySettings } from "./security-settings";
import { AccountSettings } from "./account-settings";

interface SettingsTabsProps {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    profile: {
      phone: string | null;
      address: string | null;
      country: string | null;
      dob: Date | null;
    } | null;
  };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <ProfileSettings user={user} />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsSettings />
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <SecuritySettings />
      </TabsContent>

      <TabsContent value="account" className="mt-6">
        <AccountSettings userId={user.id} />
      </TabsContent>
    </Tabs>
  );
}

