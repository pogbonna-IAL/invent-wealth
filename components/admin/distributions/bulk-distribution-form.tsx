"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";
import { createDraftDistribution } from "@/app/actions/admin/distributions";
import { format } from "date-fns";

interface Property {
  id: string;
  name: string;
  slug: string;
  totalShares: number;
  availableShares: number;
}

interface RentalStatement {
  id: string;
  propertyId: string;
  periodStart: Date;
  periodEnd: Date;
  property: {
    name: string;
  };
  distributions: Array<{
    id: string;
    status: string;
  }>;
}

interface BulkDistributionFormProps {
  properties: Property[];
  recentStatements: RentalStatement[];
}

interface DistributionItem {
  propertyId: string;
  rentalStatementId: string;
  propertyName: string;
  periodStart: string;
  periodEnd: string;
}

export function BulkDistributionForm({ properties, recentStatements }: BulkDistributionFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<DistributionItem[]>([]);
  const [selectedStatements, setSelectedStatements] = useState<Set<string>>(new Set());

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        propertyId: "",
        rentalStatementId: "",
        propertyName: "",
        periodStart: "",
        periodEnd: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DistributionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill property name when property is selected
    if (field === "propertyId") {
      const property = properties.find((p) => p.id === value);
      if (property) {
        newItems[index].propertyName = property.name;
      }
    }

    // Auto-fill period when statement is selected
    if (field === "rentalStatementId") {
      const statement = recentStatements.find((s) => s.id === value);
      if (statement) {
        newItems[index].periodStart = format(statement.periodStart, "yyyy-MM-dd");
        newItems[index].periodEnd = format(statement.periodEnd, "yyyy-MM-dd");
        newItems[index].propertyId = statement.propertyId;
        const property = properties.find((p) => p.id === statement.propertyId);
        if (property) {
          newItems[index].propertyName = property.name;
        }
      }
    }

    setItems(newItems);
  };

  const handleSelectFromStatements = (statementId: string) => {
    const newSelected = new Set(selectedStatements);
    if (newSelected.has(statementId)) {
      newSelected.delete(statementId);
    } else {
      newSelected.add(statementId);
    }
    setSelectedStatements(newSelected);
  };

  const handleAddSelectedStatements = () => {
    const newItems: DistributionItem[] = Array.from(selectedStatements)
      .map((statementId) => {
        const statement = recentStatements.find((s) => s.id === statementId);
        if (!statement) return null;

        // Skip if distribution already exists
        if (statement.distributions.length > 0) {
          return null;
        }

        const property = properties.find((p) => p.id === statement.propertyId);
        return {
          propertyId: statement.propertyId,
          rentalStatementId: statement.id,
          propertyName: property?.name || "",
          periodStart: format(statement.periodStart, "yyyy-MM-dd"),
          periodEnd: format(statement.periodEnd, "yyyy-MM-dd"),
        };
      })
      .filter((item): item is DistributionItem => item !== null);

    setItems([...items, ...newItems]);
    setSelectedStatements(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const results = [];
      const errors = [];

      for (const item of items) {
        if (!item.propertyId || !item.rentalStatementId) {
          errors.push(`Skipping ${item.propertyName || "item"}: Missing required fields`);
          continue;
        }

        try {
          const result = await createDraftDistribution({
            propertyId: item.propertyId,
            rentalStatementId: item.rentalStatementId,
          });

          if (result.success) {
            results.push({
              property: item.propertyName,
              distributionId: result.distributionId,
              payoutsCreated: result.payoutsCreated,
            });
          } else {
            errors.push(`${item.propertyName}: ${"error" in result ? result.error : "Failed to create distribution"}`);
          }
        } catch (err) {
          errors.push(`${item.propertyName}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      if (results.length > 0) {
        setSuccess(
          `Successfully created ${results.length} distribution(s). ${errors.length > 0 ? `Errors: ${errors.length}` : ""}`
        );
        setTimeout(() => {
          router.push("/admin/distributions");
          router.refresh();
        }, 2000);
      } else {
        setError(`Failed to create distributions. Errors: ${errors.join("; ")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const availableStatements = recentStatements.filter(
    (s) => s.distributions.length === 0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Add from Statements */}
      {availableStatements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Add from Recent Statements</CardTitle>
            <CardDescription>
              Select rental statements that don't have distributions yet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableStatements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedStatements.has(statement.id)}
                    onCheckedChange={() => handleSelectFromStatements(statement.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{statement.property.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(statement.periodStart, "MMM d")} - {format(statement.periodEnd, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {selectedStatements.size > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSelectedStatements}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedStatements.size} Selected Statement(s)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribution Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distribution Items</CardTitle>
              <CardDescription>
                Add properties and rental statements to create distributions
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No items added. Click "Add Item" or use "Quick Add" above to get started.
            </p>
          ) : (
            items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold">Item {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`property-${index}`}>Property</Label>
                      <select
                        id={`property-${index}`}
                        value={item.propertyId}
                        onChange={(e) => handleItemChange(index, "propertyId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select property</option>
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`statement-${index}`}>Rental Statement</Label>
                      <select
                        id={`statement-${index}`}
                        value={item.rentalStatementId}
                        onChange={(e) => handleItemChange(index, "rentalStatementId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select statement</option>
                        {recentStatements
                          .filter((s) => s.propertyId === item.propertyId || !item.propertyId)
                          .map((statement) => (
                            <option key={statement.id} value={statement.id}>
                              {statement.property.name} - {format(statement.periodStart, "MMM yyyy")}
                              {statement.distributions.length > 0 ? " (Has distribution)" : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {item.propertyName && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Property: {item.propertyName} • Period: {item.periodStart} to {item.periodEnd}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Link href="/admin/distributions">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isCreating || items.length === 0}>
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create {items.length} Distribution(s)
        </Button>
      </div>
    </form>
  );
}

