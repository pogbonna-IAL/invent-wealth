import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrganizationSchema } from "@/components/seo/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - InventWealth | Fractional Property Ownership",
  description: "Learn how fractional property ownership works. Understand how you can invest in premium properties, earn rental income, and build wealth through real estate.",
  openGraph: {
    title: "How It Works - InventWealth",
    description: "Learn how fractional property ownership works and how you can start investing today.",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <OrganizationSchema />
      <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Fractional Property Ownership Works
            </h1>
            <p className="text-xl text-muted-foreground">
              A simple guide to investing in premium properties and earning passive income
            </p>
          </div>

          {/* Step-by-Step Process */}
          <div className="space-y-8 mb-16">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <CardTitle className="text-2xl">Browse Available Properties</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-20">
                <p className="text-muted-foreground mb-4">
                  Explore our curated selection of premium properties available for fractional ownership. Each property listing includes detailed information about location, property type, projected yields, and investment terms.
                </p>
                <p className="text-muted-foreground">
                  Properties are carefully vetted by our team to ensure they meet our quality standards and have strong rental potential in the shortlet market.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    2
                  </div>
                  <CardTitle className="text-2xl">Purchase Shares</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-20">
                <p className="text-muted-foreground mb-4">
                  Once you've selected a property, you can purchase shares at the listed price per share. Each property has a minimum investment requirement, making it accessible to investors with different budget levels.
                </p>
                <p className="text-muted-foreground">
                  Your investment is confirmed immediately, and you become a fractional owner of the property. Ownership is tracked through our secure platform, and you can view your holdings at any time in your dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    3
                  </div>
                  <CardTitle className="text-2xl">Properties Generate Rental Income</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-20">
                <p className="text-muted-foreground mb-4">
                  Properties are managed professionally and rented out as short-term accommodations (shortlets). The rental income is generated from bookings throughout the month, with occupancy rates varying based on location, seasonality, and market conditions.
                </p>
                <p className="text-muted-foreground">
                  Our property management team handles all aspects of operations including guest bookings, maintenance, cleaning, and customer service, ensuring properties are well-maintained and generating optimal returns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    4
                  </div>
                  <CardTitle className="text-2xl">Receive Monthly Distributions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-20">
                <p className="text-muted-foreground mb-4">
                  Each month, we calculate the net rental income after deducting operating costs and management fees. This net distributable income is then divided proportionally among all shareholders based on their share ownership.
                </p>
                <p className="text-muted-foreground mb-4">
                  For example, if you own 1% of a property's total shares, you'll receive 1% of the net monthly income. Distributions are typically processed within 5-7 business days after the end of each rental period.
                </p>
                <p className="text-muted-foreground">
                  You can track all distributions, view detailed income statements, and monitor your investment performance through your investor dashboard.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How Distributions Work */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">How Distributions Are Calculated</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 1: Calculate Gross Revenue</h3>
                    <p className="text-muted-foreground">
                      Total income from all bookings during the rental period, including nightly rates, cleaning fees, and other rental-related income.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 2: Deduct Operating Costs</h3>
                    <p className="text-muted-foreground">
                      Operating expenses include utilities, maintenance, repairs, insurance, property taxes, cleaning services, and other day-to-day operational costs.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 3: Deduct Management Fee</h3>
                    <p className="text-muted-foreground">
                      A management fee is deducted to cover property management services, platform operations, and administrative costs. This fee is clearly disclosed for each property.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 4: Calculate Net Distributable Income</h3>
                    <p className="text-muted-foreground mb-2">
                      Net Distributable Income = Gross Revenue - Operating Costs - Management Fee
                    </p>
                    <p className="text-muted-foreground">
                      This net amount is what gets distributed to shareholders proportionally based on their share ownership percentage.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Step 5: Pro-Rata Distribution</h3>
                    <p className="text-muted-foreground">
                      Your distribution = (Your Shares ÷ Total Shares) × Net Distributable Income
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Browse available properties and start building your real estate portfolio today.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/properties">
                <Button size="lg">Browse Properties</Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </MarketingLayout>
    </>
  );
}

