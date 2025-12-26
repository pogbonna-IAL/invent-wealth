"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateInvestment } from "@/app/actions/admin/investments";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { InvestmentStatus } from "@prisma/client";

interface EditInvestmentFormProps {
  investment: {
    id: string;
    userId: string;
    propertyId: string;
    propertyName: string;
    shares: number;
    totalAmount: number;
    pricePerShareAtPurchase: number;
    status: InvestmentStatus;
    createdAt: string;
  };
}

export function EditInvestmentForm({ investment }: EditInvestmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shares: investment.shares.toString(),
    totalAmount: investment.totalAmount.toString(),
    status: investment.status,
    createdAt: investment.createdAt,
    skipPropertyUpdate: false,
  });

  const calculatedAmount = parseFloat(formData.shares) * investment.pricePerShareAtPurchase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateInvestment({
        id: investment.id,
        shares: parseFloat(formData.shares),
        totalAmount: parseFloat(formData.totalAmount),
        status: formData.status,
        createdAt: formData.createdAt,
        skipPropertyUpdate: formData.skipPropertyUpdate,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Failed to update investment");
      }

      router.push(`/admin/users/${investment.userId}`);
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
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>Property: {investment.propertyName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares *</Label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={formData.shares}
                onChange={(e) => {
                  const newShares = e.target.value;
                  setFormData({
                    ...formData,
                    shares: newShares,
                    totalAmount: ((parseFloat(newShares) || 0) * investment.pricePerShareAtPurchase).toString(),
                  });
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Price per share: {formatCurrencyNGN(investment.pricePerShareAtPurchase, "NGN")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Calculated: {formatCurrencyNGN(calculatedAmount, "NGN")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: InvestmentStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdAt">Investment Date</Label>
              <Input
                id="createdAt"
                type="datetime-local"
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="skipPropertyUpdate"
              checked={formData.skipPropertyUpdate}
              onChange={(e) =>
                setFormData({ ...formData, skipPropertyUpdate: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="skipPropertyUpdate" className="text-sm cursor-pointer">
              Skip property share update (for corrections without affecting property availability)
            </Label>
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
        <Link href={`/admin/users/${investment.userId}`}>
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Investment
        </Button>
      </div>
    </form>
  );
}

