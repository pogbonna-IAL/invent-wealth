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
import { createUserManually } from "@/app/actions/admin/users";
import { OnboardingStatus, KycStatus } from "@prisma/client";

export function CreateUserForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    email: string;
    name: string;
    phone: string;
    address: string;
    country: string;
    dob: string;
    createdAt: string;
    kycStatus: KycStatus;
    onboardingStatus: OnboardingStatus;
    riskTolerance: string;
    investmentExperience: string;
  }>({
    email: "",
    name: "",
    phone: "",
    address: "",
    country: "",
    dob: "",
    createdAt: "",
    kycStatus: KycStatus.APPROVED,
    onboardingStatus: OnboardingStatus.COMPLETED,
    riskTolerance: "moderate",
    investmentExperience: "intermediate",
  });

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      phone: "",
      address: "",
      country: "",
      dob: "",
      createdAt: "",
      kycStatus: "APPROVED",
      onboardingStatus: "COMPLETED",
      riskTolerance: "moderate",
      investmentExperience: "intermediate",
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

    try {
      const result = await createUserManually({
        ...formData,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        country: formData.country || undefined,
        dob: formData.dob || undefined,
        createdAt: formData.createdAt || undefined,
        riskTolerance: formData.riskTolerance || undefined,
        investmentExperience: formData.investmentExperience || undefined,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Failed to create user");
      }

      // Show success message
      setSuccess(`User "${formData.name}" (${formData.email}) created successfully!`);

      // Reset form fields
      resetForm();

      // Refresh router to update any cached data
      router.refresh();
      
      // Stay on the same page to allow creating another user
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
          <CardTitle>User Account Details</CardTitle>
          <CardDescription>Basic account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="investor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="createdAt">Account Creation Date</Label>
            <Input
              id="createdAt"
              type="datetime-local"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use current date. Set a past date to backdate the account creation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investor Profile</CardTitle>
          <CardDescription>Personal and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+2348000000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Nigeria"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, City"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding & KYC Status</CardTitle>
          <CardDescription>Set initial onboarding and KYC status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onboardingStatus">Onboarding Status</Label>
              <Select
                value={formData.onboardingStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, onboardingStatus: value as OnboardingStatus })
                }
              >
                <SelectTrigger id="onboardingStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kycStatus">KYC Status</Label>
              <Select
                value={formData.kycStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, kycStatus: value as KycStatus })
                }
              >
                <SelectTrigger id="kycStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="riskTolerance">Risk Tolerance</Label>
              <Select
                value={formData.riskTolerance}
                onValueChange={(value) => setFormData({ ...formData, riskTolerance: value })}
              >
                <SelectTrigger id="riskTolerance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentExperience">Investment Experience</Label>
              <Select
                value={formData.investmentExperience}
                onValueChange={(value) => setFormData({ ...formData, investmentExperience: value })}
              >
                <SelectTrigger id="investmentExperience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          Create User
        </Button>
      </div>
    </form>
  );
}

