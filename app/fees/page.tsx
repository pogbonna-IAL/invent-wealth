import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fees & Pricing - InventWealth | Transparent Investment Fees",
  description: "Understand our transparent fee structure. Learn about platform fees, management fees, and how they affect your investment returns.",
  openGraph: {
    title: "Fees & Pricing - InventWealth",
    description: "Transparent fee structure for fractional property investments.",
    type: "website",
  },
};

export default function FeesPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Transparent Fees & Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              Clear, upfront information about all costs associated with your investment
            </p>
          </div>

          {/* Platform Fee */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Platform Fee</CardTitle>
              <CardDescription>One-time fee when you invest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                When you purchase shares in a property, a small platform fee may apply. This fee covers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Transaction processing and verification</li>
                <li>Platform maintenance and security</li>
                <li>Legal and compliance costs</li>
                <li>Customer support services</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Platform fees, if applicable, are clearly disclosed before you complete your investment and are included in the total investment amount shown.
              </p>
            </CardContent>
          </Card>

          {/* Management Fee */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Property Management Fee</CardTitle>
              <CardDescription>Ongoing fee for property operations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Each property has a management fee that covers the ongoing costs of property operations. This fee is deducted from the gross rental revenue before distributions are calculated.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">Management fees typically cover:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Professional property management services</li>
                  <li>Guest booking and reservation management</li>
                  <li>Property maintenance and repairs</li>
                  <li>Cleaning and housekeeping services</li>
                  <li>24/7 guest support and customer service</li>
                  <li>Marketing and listing management</li>
                  <li>Administrative and accounting services</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Management fees vary by property and are clearly disclosed in each property's investment details. They are typically calculated as a percentage of gross revenue or as a fixed monthly amount, depending on the property.
              </p>
            </CardContent>
          </Card>

          {/* Operating Costs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Operating Costs</CardTitle>
              <CardDescription>Property expenses deducted from revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Operating costs are the day-to-day expenses required to maintain and operate the property. These costs are deducted from gross rental revenue before calculating distributions.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold mb-2">Common operating costs include:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Utilities (electricity, water, gas)</li>
                    <li>Internet and cable services</li>
                    <li>Property insurance</li>
                    <li>Property taxes</li>
                    <li>Maintenance and repairs</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Additional costs may include:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Cleaning supplies and services</li>
                    <li>Landscaping and exterior maintenance</li>
                    <li>HOA fees (if applicable)</li>
                    <li>Licensing and permits</li>
                    <li>Emergency repairs</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                All operating costs are tracked and reported in monthly income statements, which are available in your dashboard for full transparency.
              </p>
            </CardContent>
          </Card>

          {/* Fee Transparency */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fee Transparency</CardTitle>
              <CardDescription>We believe in complete transparency</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                At InventWealth, we believe in complete transparency. All fees are clearly disclosed before you invest, and you can see exactly how your distributions are calculated in detailed monthly income statements.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Pre-Investment Disclosure</p>
                    <p className="text-sm text-muted-foreground">
                      All fees are clearly shown before you complete your investment, so you know exactly what you're paying.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Monthly Income Statements</p>
                    <p className="text-sm text-muted-foreground">
                      Detailed breakdowns of all revenue, costs, and fees are provided in monthly statements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">No Hidden Fees</p>
                    <p className="text-sm text-muted-foreground">
                      We don't charge hidden fees. Everything is disclosed upfront and documented in your account.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card>
            <CardHeader>
              <CardTitle>Example Distribution Calculation</CardTitle>
              <CardDescription>How fees affect your returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Monthly Rental Period Example:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Rental Revenue:</span>
                      <span className="font-semibold">$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operating Costs:</span>
                      <span className="font-semibold">-$2,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Management Fee (10%):</span>
                      <span className="font-semibold">-$1,000</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Net Distributable Income:</span>
                      <span className="font-bold text-lg">$7,000</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you own 100 shares out of 10,000 total shares (1%), your monthly distribution would be: (100 ÷ 10,000) × $7,000 = $70
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold">Important:</strong> Fee structures may vary by property. Always review the specific fee information provided for each property before investing. Past performance and example calculations are for illustrative purposes only and do not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

