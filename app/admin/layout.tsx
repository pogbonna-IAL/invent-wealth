import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/server/services/admin.service";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Check if user is admin
  const admin = await isAdmin(session.user.id);
  if (!admin) {
    redirect("/dashboard?error=unauthorized");
  }

  return <AdminLayout user={session.user}>{children}</AdminLayout>;
}

