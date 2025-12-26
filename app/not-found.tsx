import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-8 text-muted-foreground">Page not found</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}

