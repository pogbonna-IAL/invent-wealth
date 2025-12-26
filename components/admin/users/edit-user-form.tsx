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
import { updateUserManually } from "@/app/actions/admin/users";
import { OnboardingStatus, KycStatus } from "@prisma/client";

interface EditUserFormProps {
  user: {
    id: string;
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
  };
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    country: user.country,
    dob: user.dob,
    createdAt: user.createdAt,
    kycStatus: user.kycStatus,
    onboardingStatus: user.onboardingStatus,
    riskTolerance: user.riskTolerance,
    investmentExperience: user.investmentExperience,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserManually({
        id: user.id,
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
        throw new Error("error" in result ? result.error : "Failed to update user");
      }

      router.push(`/admin/users/${user.id}`);
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
              Update the account creation date if needed for backdating.
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
          <CardDescription>Update onboarding and KYC status</CardDescription>
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Link href={`/admin/users/${user.id}`}>
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update User
        </Button>
      </div>
    </form>
  );
}

