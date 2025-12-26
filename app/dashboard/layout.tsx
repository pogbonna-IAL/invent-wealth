import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Additional protection (middleware handles redirect, but this ensures server-side)
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </AppLayout>
  );
}

