"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { createBackdatedInvestment } from "@/app/actions/admin/investments";
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface Property {
  id: string;
  name: string;
  availableShares: number;
  minShares: number;
  pricePerShare: number;
  status: string;
}

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface CreateBackdatedInvestmentFormProps {
  properties: Property[];
  users: User[];
}

export function CreateBackdatedInvestmentForm({
  properties,
  users,
}: CreateBackdatedInvestmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    propertyId: "",
    shares: "",
    investmentDate: "",
    skipPropertyUpdate: false,
  });

  const selectedProperty = properties.find((p) => p.id === formData.propertyId);
  const totalAmount = selectedProperty && formData.shares
    ? selectedProperty.pricePerShare * parseFloat(formData.shares)
    : 0;

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      userId: "",
      propertyId: "",
      shares: "",
      investmentDate: "",
      skipPropertyUpdate: false,
    });
    setError(null);
  };

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.userId || !formData.propertyId || !formData.shares || !formData.investmentDate) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createBackdatedInvestment({
        userId: formData.userId,
        propertyId: formData.propertyId,
        shares: parseFloat(formData.shares),
        investmentDate: formData.investmentDate,
        skipPropertyUpdate: formData.skipPropertyUpdate,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Failed to create investment");
      }

      // Get user and property names for success message
      const user = users.find(u => u.id === formData.userId);
      const property = properties.find(p => p.id === formData.propertyId);
      const userName = user?.name || user?.email || "Unknown User";
      const propertyName = property?.name || "Unknown Property";

      // Show success message
      setSuccess(
        `Investment created successfully! ${formData.shares} shares for ${propertyName} - ${formatCurrencyNGN(totalAmount, "NGN")}`
      );

      // Reset form fields
      resetForm();

      // Refresh router to update any cached data
      router.refresh();
      
      // Stay on the same page to allow creating another investment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>Select investor, property, and investment date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Investor *</Label>
            <Select
              value={formData.userId}
              onValueChange={(value) => setFormData({ ...formData, userId: value })}
              required
            >
              <SelectTrigger id="userId">
                <SelectValue placeholder="Select investor" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email || "Unknown User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                    {property.name} ({property.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares *</Label>
              <Input
                id="shares"
                type="number"
                min={selectedProperty?.minShares || 1}
                max={selectedProperty?.availableShares || undefined}
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                required
              />
              {selectedProperty && (
                <p className="text-xs text-muted-foreground">
                  Min: {selectedProperty.minShares.toLocaleString()} • 
                  Available: {selectedProperty.availableShares.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentDate">Investment Date *</Label>
              <Input
                id="investmentDate"
                type="datetime-local"
                value={formData.investmentDate}
                onChange={(e) => setFormData({ ...formData, investmentDate: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Set the date when this investment was made (for historical data import)
              </p>
            </div>
          </div>

          {selectedProperty && formData.shares && (
            <div className="rounded-lg border p-4 bg-muted">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price per share</span>
                <span className="font-semibold">
                  {formatCurrencyNGN(selectedProperty.pricePerShare, "NGN")}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold">
                  {formatCurrencyNGN(totalAmount, "NGN")}
                </span>
              </div>
            </div>
          )}

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
              Skip property share update (for historical data where property shares were already updated)
            </Label>
          </div>
        </CardContent>
      </Card>

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Link href="/admin/users">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Investment
        </Button>
      </div>
    </form>
  );
}

