"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProperty } from "@/app/actions/admin/properties";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PropertyType, ShortletModel, PropertyStatus } from "@prisma/client";

const propertyTypes = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "CONDO",
  "TOWNHOUSE",
];

const shortletModels = [
  "ENTIRE_HOME",
  "PRIVATE_ROOM",
];

const statuses = ["OPEN", "FUNDED", "CLOSED"];

export function CreatePropertyForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    city: "",
    country: "",
    addressShort: "",
    description: "",
    propertyType: "",
    shortletModel: "",
    totalShares: "",
    pricePerShare: "",
    minShares: "",
    targetRaise: "",
    projectedAnnualYieldPct: "",
    status: "OPEN",
    coverImage: "",
    gallery: "",
    highlights: "",
    createdAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const highlightsArray = formData.highlights
        .split("\n")
        .filter((h) => h.trim() !== "");

      const galleryArray = formData.gallery
        .split("\n")
        .map(url => url.trim())
        .filter(url => url !== "" && (url.startsWith("http://") || url.startsWith("https://")))
        .slice(0, 20);

      const result = await createProperty({
        name: formData.name,
        slug: formData.slug,
        city: formData.city,
        country: formData.country,
        addressShort: formData.addressShort,
        description: formData.description,
        propertyType: formData.propertyType as PropertyType,
        shortletModel: formData.shortletModel as ShortletModel,
        status: formData.status as PropertyStatus,
        totalShares: parseInt(formData.totalShares),
        pricePerShare: parseFloat(formData.pricePerShare),
        minShares: parseInt(formData.minShares),
        targetRaise: formData.targetRaise ? parseFloat(formData.targetRaise) : undefined,
        projectedAnnualYieldPct: parseFloat(formData.projectedAnnualYieldPct),
        highlights: highlightsArray,
        gallery: galleryArray,
        coverImage: formData.coverImage || undefined,
        createdAt: formData.createdAt || undefined,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Failed to create property");
      }

      router.push(`/admin/properties/${result.propertyId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Property name and location details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Luxury Beachfront Villa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="luxury-beachfront-villa"
            />
            <p className="text-xs text-muted-foreground">
              Used in the property URL: /properties/{formData.slug || "slug"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="Lagos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                placeholder="Nigeria"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressShort">Short Address *</Label>
            <Input
              id="addressShort"
              value={formData.addressShort}
              onChange={(e) => setFormData({ ...formData, addressShort: e.target.value })}
              required
              placeholder="Victoria Island, Lagos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Detailed property description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Highlights (one per line)</Label>
            <Textarea
              id="highlights"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              rows={4}
              placeholder="Ocean view&#10;Swimming pool&#10;Modern amenities"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>Type and shortlet model</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value as PropertyType })}
                required
              >
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortletModel">Shortlet Model *</Label>
              <Select
                value={formData.shortletModel}
                onValueChange={(value) => setFormData({ ...formData, shortletModel: value as ShortletModel })}
                required
              >
                <SelectTrigger id="shortletModel">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {shortletModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gallery">Gallery Images (1-20 URLs, one per line)</Label>
            <Textarea
              id="gallery"
              value={formData.gallery}
              onChange={(e) => {
                const lines = e.target.value.split("\n").filter(line => line.trim() !== "");
                if (lines.length <= 20) {
                  setFormData({ ...formData, gallery: e.target.value });
                }
              }}
              rows={8}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Enter 1-20 image URLs, one per line. {formData.gallery.split("\n").filter(l => l.trim()).length}/20 images
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>Shares, pricing, and funding information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="createdAt">Property Creation Date</Label>
            <Input
              id="createdAt"
              type="datetime-local"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use current date. Set a past date to backdate the property creation (for importing existing properties).
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalShares">Total Shares *</Label>
              <Input
                id="totalShares"
                type="number"
                value={formData.totalShares}
                onChange={(e) => setFormData({ ...formData, totalShares: e.target.value })}
                required
                min="1"
                placeholder="100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerShare">Price per Share (₦) *</Label>
              <Input
                id="pricePerShare"
                type="number"
                step="0.01"
                value={formData.pricePerShare}
                onChange={(e) => setFormData({ ...formData, pricePerShare: e.target.value })}
                required
                min="0.01"
                placeholder="15000.00"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minShares">Minimum Shares *</Label>
              <Input
                id="minShares"
                type="number"
                value={formData.minShares}
                onChange={(e) => setFormData({ ...formData, minShares: e.target.value })}
                required
                min="1"
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRaise">Target Raise (₦)</Label>
              <Input
                id="targetRaise"
                type="number"
                step="0.01"
                value={formData.targetRaise}
                onChange={(e) => setFormData({ ...formData, targetRaise: e.target.value })}
                placeholder="1500000000.00"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Auto-calculated if not provided
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectedAnnualYieldPct">Projected Annual Yield (%) *</Label>
              <Input
                id="projectedAnnualYieldPct"
                type="number"
                step="0.01"
                value={formData.projectedAnnualYieldPct}
                onChange={(e) => setFormData({ ...formData, projectedAnnualYieldPct: e.target.value })}
                required
                min="0"
                max="100"
                placeholder="8.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as PropertyStatus })}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
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
        <Link href="/admin/properties">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Property
        </Button>
      </div>
    </form>
  );
}

