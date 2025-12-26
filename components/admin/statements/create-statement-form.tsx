"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Property, PropertyStatus } from "@prisma/client";
import { CSVImportButton } from "./csv-import-button";
import { calculateMonthlyBreakdown, type MonthlyBreakdown } from "@/lib/utils/statement-pro-rating";
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface CreateStatementFormProps {
  properties: Array<Omit<Property, "pricePerShare" | "targetRaise" | "projectedAnnualYieldPct"> & {
    pricePerShare: number;
    targetRaise: number | null;
    projectedAnnualYieldPct: number;
  }>;
}

interface OperatingCostItem {
  id: string;
  category: string;
  description: string;
  amount: string;
}

const OPERATING_COST_CATEGORIES = [
  { value: "GENERAL_OPERATIONS", label: "General Operations Expenses" },
  { value: "MARKETING", label: "Marketing Expenses" },
  { value: "MAINTENANCE", label: "Maintenance Expenses" },
] as const;

export function CreateStatementForm({ properties }: CreateStatementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatingCostItems, setOperatingCostItems] = useState<OperatingCostItem[]>([
    { id: "1", category: "", description: "", amount: "" },
  ]);
  const [periodInfo, setPeriodInfo] = useState<{
    days: number;
    months: number;
    breakdown: MonthlyBreakdown[] | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    propertyId: "",
    periodStart: "",
    periodEnd: "",
    grossRevenue: "",
    managementFeePct: "",
    incomeAdjustment: "",
    occupancyRatePct: "",
    adr: "",
    notes: "",
  });

  const [calculatedValues, setCalculatedValues] = useState({
    adr: 0,
    managementFee: 0,
  });

  // Calculate period info when dates change
  useEffect(() => {
    if (formData.periodStart && formData.periodEnd) {
      const start = new Date(formData.periodStart);
      const end = new Date(formData.periodEnd);
      
      if (end >= start) {
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const breakdown = calculateMonthlyBreakdown(start, end);
        const months = breakdown.length;
        
        setPeriodInfo({ days, months, breakdown });
      } else {
        setPeriodInfo(null);
      }
    } else {
      setPeriodInfo(null);
    }
  }, [formData.periodStart, formData.periodEnd]);

  // Calculate ADR and Management Fee when inputs change
  useEffect(() => {
    if (formData.grossRevenue && formData.periodStart && formData.periodEnd) {
      const start = new Date(formData.periodStart);
      const end = new Date(formData.periodEnd);
      
      if (end >= start) {
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const grossRevenue = parseFloat(formData.grossRevenue) || 0;
        const occupancyRatePct = parseFloat(formData.occupancyRatePct) || 0;
        
        // Calculate ADR with occupancy if provided, otherwise use total days
        let adr = 0;
        if (occupancyRatePct > 0 && occupancyRatePct <= 100) {
          // ADR = Gross Revenue / Occupied Days
          // Occupied Days = Total Days × (Occupancy Rate / 100)
          const occupiedDays = days * (occupancyRatePct / 100);
          adr = occupiedDays > 0 ? grossRevenue / occupiedDays : 0;
        } else {
          // Fallback: ADR = Gross Revenue / Total Days (when occupancy not provided)
          adr = days > 0 ? grossRevenue / days : 0;
        }
        
        // Calculate Management Fee from percentage
        const managementFeePct = parseFloat(formData.managementFeePct) || 0;
        const managementFee = grossRevenue * (managementFeePct / 100);
        
        setCalculatedValues({
          adr: Math.round(adr * 100) / 100,
          managementFee: Math.round(managementFee * 100) / 100,
        });
        
        // Auto-update ADR field
        setFormData(prev => ({ ...prev, adr: adr > 0 ? adr.toFixed(2) : "" }));
      }
    } else {
      setCalculatedValues({ adr: 0, managementFee: 0 });
      setFormData(prev => ({ ...prev, adr: "" }));
    }
  }, [formData.grossRevenue, formData.periodStart, formData.periodEnd, formData.managementFeePct, formData.occupancyRatePct]);

  const addOperatingCostItem = () => {
    setOperatingCostItems([
      ...operatingCostItems,
      { id: Date.now().toString(), category: "", description: "", amount: "" },
    ]);
  };

  const removeOperatingCostItem = (id: string) => {
    if (operatingCostItems.length > 1) {
      setOperatingCostItems(operatingCostItems.filter((item) => item.id !== id));
    }
  };

  const updateOperatingCostItem = (id: string, field: "category" | "description" | "amount", value: string) => {
    setOperatingCostItems(
      operatingCostItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotalOperatingCosts = () => {
    return operatingCostItems.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      return total + amount;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate operating cost items
    const validItems = operatingCostItems.filter(
      (item) => item.description.trim() && item.amount && parseFloat(item.amount) > 0
    );

    if (validItems.length === 0) {
      setError("Please add at least one operating cost item with description and amount.");
      setIsLoading(false);
      return;
    }

    const operatingCostItemsData = validItems.map((item) => ({
      description: item.description.trim(),
      amount: parseFloat(item.amount),
      category: item.category || undefined, // Include category if provided
    }));

    const totalOperatingCosts = calculateTotalOperatingCosts();
    const grossRevenue = parseFloat(formData.grossRevenue);
    const managementFee = calculatedValues.managementFee; // Use calculated value
    const incomeAdjustment = parseFloat(formData.incomeAdjustment) || 0;

    try {
      const response = await fetch("/api/admin/statements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          grossRevenue,
          operatingCosts: totalOperatingCosts,
          operatingCostItems: operatingCostItemsData,
          managementFee, // Send calculated dollar amount
          managementFeePct: parseFloat(formData.managementFeePct), // Also send percentage
          incomeAdjustment, // Include income adjustment
          occupancyRatePct: parseFloat(formData.occupancyRatePct),
          adr: parseFloat(formData.adr) || calculatedValues.adr, // Use calculated ADR
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create statement");
      }

      router.push("/admin/statements");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statement Details</CardTitle>
          <CardDescription>Property and period information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyId">Property *</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
              required
            >
              <SelectTrigger id="propertyId">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start *</Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Backdating allowed for historical data import
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                required
              />
            </div>
          </div>

          {periodInfo && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              <p>
                Period spans <strong>{periodInfo.days} days</strong> across{" "}
                <strong>{periodInfo.months} month(s)</strong>
              </p>
              {periodInfo.breakdown && periodInfo.breakdown.length > 1 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium">Monthly Breakdown:</p>
                  {periodInfo.breakdown.map((month, idx) => (
                    <p key={idx} className="text-xs">
                      {month.month}: {month.daysInPeriod} days ({Math.round(month.prorationFactor * 100)}% of month)
                    </p>
                  ))}
                  <p className="text-xs mt-2 font-medium text-foreground">
                    Cost items will be pro-rated to monthly values based on days in each month.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Details</CardTitle>
          <CardDescription>Revenue, costs, and fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grossRevenue">Gross Revenue (₦) *</Label>
            <Input
              id="grossRevenue"
              type="number"
              step="0.01"
              value={formData.grossRevenue}
              onChange={(e) => setFormData({ ...formData, grossRevenue: e.target.value })}
              required
              min="0"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Operating Costs *</Label>
              <div className="flex gap-2">
                <CSVImportButton
                  onImport={(importedItems) => {
                    // Convert imported items to form format
                    const newItems = importedItems.map((item, index) => ({
                      id: `imported-${Date.now()}-${index}`,
                      category: item.category || "", // Support category if present in CSV
                      description: item.description,
                      amount: item.amount.toString(),
                    }));
                    
                    // Merge with existing items (or replace if first item is empty)
                    if (operatingCostItems.length === 1 && !operatingCostItems[0].description && !operatingCostItems[0].amount) {
                      setOperatingCostItems(newItems);
                    } else {
                      setOperatingCostItems([...operatingCostItems, ...newItems]);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOperatingCostItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cost Item
                </Button>
              </div>
            </div>

            {/* Group items by category for display */}
            {(() => {
              // Group items by category
              const groupedItems = operatingCostItems.reduce((acc, item) => {
                const category = item.category || "UNCATEGORIZED";
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(item);
                return acc;
              }, {} as Record<string, OperatingCostItem[]>);

              // Get category order (categorized first, then uncategorized)
              const categoryOrder = [
                ...OPERATING_COST_CATEGORIES.map(c => c.value),
                "UNCATEGORIZED"
              ];

              return (
                <div className="space-y-4">
                  {categoryOrder.map((categoryKey) => {
                    const items = groupedItems[categoryKey];
                    if (!items || items.length === 0) return null;

                    const categoryLabel = OPERATING_COST_CATEGORIES.find(c => c.value === categoryKey)?.label || "Uncategorized";
                    const categoryTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

                    return (
                      <div key={categoryKey} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">{categoryLabel}</h4>
                          <span className="text-sm font-medium text-muted-foreground">
                            Subtotal: {formatCurrencyNGN(categoryTotal, "NGN")}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={item.id} className="grid gap-3 md:grid-cols-[150px_1fr_200px_auto] items-end bg-background p-3 rounded-md border">
                              <div className="space-y-2">
                                <Label htmlFor={`cost-category-${item.id}`}>
                                  Category
                                </Label>
                                <Select
                                  value={item.category || ""}
                                  onValueChange={(value) =>
                                    updateOperatingCostItem(item.id, "category", value)
                                  }
                                >
                                  <SelectTrigger id={`cost-category-${item.id}`}>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPERATING_COST_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`cost-desc-${item.id}`}>
                                  Description
                                </Label>
                                <Input
                                  id={`cost-desc-${item.id}`}
                                  type="text"
                                  placeholder="e.g., Utilities, Maintenance, Insurance"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateOperatingCostItem(item.id, "description", e.target.value)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`cost-amount-${item.id}`}>Amount (₦)</Label>
                                <Input
                                  id={`cost-amount-${item.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={item.amount}
                                  onChange={(e) =>
                                    updateOperatingCostItem(item.id, "amount", e.target.value)
                                  }
                                  required
                                />
                              </div>
                              <div className="flex items-end">
                                {operatingCostItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOperatingCostItem(item.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Total Operating Costs */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Operating Costs:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrencyNGN(calculateTotalOperatingCosts(), "NGN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="managementFeePct">Management Fee (%) *</Label>
            <Input
              id="managementFeePct"
              type="number"
              step="0.1"
              value={formData.managementFeePct}
              onChange={(e) => setFormData({ ...formData, managementFeePct: e.target.value })}
              required
              min="0"
              max="100"
              placeholder="e.g., 10"
            />
            {calculatedValues.managementFee > 0 && (
              <p className="text-xs text-muted-foreground">
                Calculated amount: {formatCurrencyNGN(calculatedValues.managementFee, "NGN")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Management fee is calculated as a percentage of gross revenue
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incomeAdjustment">Income Adjustment (₦)</Label>
            <Input
              id="incomeAdjustment"
              type="number"
              step="0.01"
              value={formData.incomeAdjustment}
              onChange={(e) => setFormData({ ...formData, incomeAdjustment: e.target.value })}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Add positive amount to increase net income, negative to decrease. Use for unforeseen events post account preparation.
            </p>
            {formData.incomeAdjustment && parseFloat(formData.incomeAdjustment) !== 0 && (
              <p className={`text-xs font-medium ${parseFloat(formData.incomeAdjustment) > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {parseFloat(formData.incomeAdjustment) > 0 ? "+" : ""}
                {formatCurrencyNGN(parseFloat(formData.incomeAdjustment), "NGN")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Occupancy and ADR</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupancyRatePct">Occupancy Rate (%) *</Label>
              <Input
                id="occupancyRatePct"
                type="number"
                step="0.1"
                value={formData.occupancyRatePct}
                onChange={(e) => setFormData({ ...formData, occupancyRatePct: e.target.value })}
                required
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Enter the percentage of days the property was occupied during this period. 
                Calculated as: (Booked Days ÷ Total Days) × 100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adr">Average Daily Rate (ADR) (₦) *</Label>
              <Input
                id="adr"
                type="number"
                step="0.01"
                value={formData.adr}
                readOnly
                className="bg-muted cursor-not-allowed"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                {formData.occupancyRatePct && parseFloat(formData.occupancyRatePct) > 0 && parseFloat(formData.occupancyRatePct) <= 100
                  ? `Auto-calculated: Gross Revenue ÷ (Total Days × Occupancy Rate / 100)`
                  : `Auto-calculated: Gross Revenue ÷ Total Days in Period`}
              </p>
              {formData.occupancyRatePct && parseFloat(formData.occupancyRatePct) > 0 && parseFloat(formData.occupancyRatePct) <= 100 && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Using occupancy-adjusted calculation (rate per occupied day)
                </p>
              )}
              {calculatedValues.adr > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrencyNGN(calculatedValues.adr, "NGN")}{" "}
                  {formData.occupancyRatePct && parseFloat(formData.occupancyRatePct) > 0 && parseFloat(formData.occupancyRatePct) <= 100
                    ? "per occupied day"
                    : "per day"}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Additional notes about this statement..."
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Link href="/admin/statements">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Statement
        </Button>
      </div>
    </form>
  );
}

