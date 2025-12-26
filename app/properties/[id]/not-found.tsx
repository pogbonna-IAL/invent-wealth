import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-2xl font-bold">Property Not Found</h1>
      <p className="mb-8 text-muted-foreground">
        The property you're looking for doesn't exist or has been removed.
      </p>
      <Link href="/properties">
        <Button>Browse Properties</Button>
      </Link>
    </div>
  );
}

