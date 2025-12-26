import { CreateUserForm } from "@/components/admin/users/create-user-form";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create User Account</h1>
        <p className="text-muted-foreground">
          Manually create an investor account and populate their details
        </p>
      </div>

      <CreateUserForm />
    </div>
  );
}

