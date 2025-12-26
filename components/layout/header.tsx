import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          InventWealth
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/properties">
                <Button variant="ghost">Properties</Button>
              </Link>
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

