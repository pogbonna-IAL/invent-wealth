"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingStep1Props {
  initialData: {
    name: string;
    phone: string;
    address: string;
    country: string;
    dob: string;
  };
  userEmail: string;
  onNext: (data: OnboardingStep1Props["initialData"]) => void;
}

const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "Other",
];

export function OnboardingStep1({
  initialData,
  userEmail,
  onNext,
}: OnboardingStep1Props) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

      if (actualAge < 18) {
        newErrors.dob = "You must be at least 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={userEmail}
          disabled
          className="bg-muted"
          aria-label="Email address (read-only)"
        />
        <p className="text-xs text-muted-foreground">
          This is the email address associated with your account
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="focus-visible:ring-2"
          aria-label="Full name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+234 800 000 0000"
          required
          className="focus-visible:ring-2"
          aria-label="Phone number"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive" role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address (Optional)</Label>
        <Input
          id="address"
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street address"
          className="focus-visible:ring-2"
          aria-label="Address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.country}
          onValueChange={(value) => setFormData({ ...formData, country: value })}
          required
        >
          <SelectTrigger
            className="focus-visible:ring-2"
            aria-label="Country"
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? "country-error" : undefined}
          >
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && (
          <p id="country-error" className="text-sm text-destructive" role="alert">
            {errors.country}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">
          Date of Birth <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dob"
          type="date"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          required
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
            .toISOString()
            .split("T")[0]}
          className="focus-visible:ring-2"
          aria-label="Date of birth"
          aria-invalid={!!errors.dob}
          aria-describedby={errors.dob ? "dob-error" : undefined}
        />
        {errors.dob && (
          <p id="dob-error" className="text-sm text-destructive" role="alert">
            {errors.dob}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          You must be at least 18 years old to invest
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="focus-visible:ring-2">
          Continue
        </Button>
      </div>
    </form>
  );
}

