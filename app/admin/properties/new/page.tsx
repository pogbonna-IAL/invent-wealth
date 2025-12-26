import { CreatePropertyForm } from "@/components/admin/properties/create-property-form";

export const dynamic = "force-dynamic";

export default function NewPropertyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Property</h1>
        <p className="text-muted-foreground">
          Add a new property to the platform
        </p>
      </div>

      <CreatePropertyForm />
    </div>
  );
}

