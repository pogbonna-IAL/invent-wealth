"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertyCard } from "@/components/ui/property-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface PropertiesCatalogProps {
  properties: any[];
  cities: string[];
  types: string[];
  currentFilters: {
    city?: string;
    type?: string;
    minInvestment?: string;
    status?: string;
    sort?: string;
  };
}

export function PropertiesCatalog({
  properties,
  cities,
  types,
  currentFilters,
}: PropertiesCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(currentFilters.city || "");
  const [type, setType] = useState(currentFilters.type || "");
  const [minInvestment, setMinInvestment] = useState(currentFilters.minInvestment || "");
  const [status, setStatus] = useState(currentFilters.status || "");
  const [sort, setSort] = useState(currentFilters.sort || "newest");

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/dashboard/properties?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };

  const clearFilters = () => {
    router.push("/dashboard/properties");
  };

  const hasActiveFilters =
    city || type || minInvestment || status || sort !== "newest";

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select
                value={city || "all"}
                onValueChange={(value) => {
                  setCity(value === "all" ? "" : value);
                  handleFilterChange("city", value === "all" ? "" : value);
                }}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <Select
                value={type || "all"}
                onValueChange={(value) => {
                  setType(value === "all" ? "" : value);
                  handleFilterChange("type", value === "all" ? "" : value);
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minInvestment">Min Investment (₦)</Label>
              <Input
                id="minInvestment"
                type="number"
                placeholder="Any"
                value={minInvestment}
                onChange={(e) => setMinInvestment(e.target.value)}
                onBlur={() => handleFilterChange("minInvestment", minInvestment)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFilterChange("minInvestment", minInvestment);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status || "all"}
                onValueChange={(value) => {
                  setStatus(value === "all" ? "" : value);
                  handleFilterChange("status", value === "all" ? "" : value);
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="FUNDED">Funded</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value);
                  handleFilterChange("sort", value);
                }}
              >
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="yield">Highest Yield</SelectItem>
                  <SelectItem value="funding">Funding Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {properties.length} {properties.length === 1 ? "property" : "properties"} found
          </p>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No properties match your filters. Try adjusting your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const investedShares = property.totalShares - property.availableShares;
              const fundingPercentage = (investedShares / property.totalShares) * 100;
              
              return (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  slug={property.slug}
                  name={property.name}
                  addressShort={property.addressShort}
                  city={property.city}
                  country={property.country}
                  coverImage={property.coverImage}
                  pricePerShare={property.pricePerShare}
                  totalShares={property.totalShares}
                  availableShares={property.availableShares}
                  minShares={property.minShares}
                  status={property.status}
                  projectedAnnualYieldPct={property.projectedAnnualYieldPct}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

