import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - InventWealth | Legal Terms",
  description: "Read InventWealth's terms of service for using our fractional property ownership platform.",
  openGraph: {
    title: "Terms of Service - InventWealth",
    description: "Terms and conditions for using InventWealth platform.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  By accessing and using the InventWealth platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform.
                </p>
                <p>
                  We reserve the right to modify these Terms at any time. Your continued use of the Platform after changes are posted constitutes your acceptance of the modified Terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Platform Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  InventWealth is a platform that facilitates fractional ownership of real estate properties. Through the Platform, investors can purchase shares in properties and receive distributions from rental income proportional to their ownership.
                </p>
                <p>
                  The Platform provides information about properties, facilitates share purchases, manages distributions, and provides investor account management tools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Investment Risks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">All investments carry risk.</strong> Investing in fractional property ownership involves substantial risk of loss. You may lose some or all of your investment.
                </p>
                <p>Risks include but are not limited to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Property value fluctuations</li>
                  <li>Rental income variability</li>
                  <li>Market conditions and economic factors</li>
                  <li>Property damage or loss</li>
                  <li>Regulatory changes</li>
                  <li>Liquidity constraints (shares may not be easily transferable)</li>
                  <li>Management and operational risks</li>
                </ul>
                <p>
                  Past performance does not guarantee future results. Projected returns are estimates only and are not guarantees. You should only invest what you can afford to lose.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. No Investment Advice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  The information provided on the Platform is for informational purposes only and does not constitute investment, financial, legal, or tax advice. You should consult with qualified professionals before making investment decisions.
                </p>
                <p>
                  InventWealth does not provide investment advice or recommendations. All investment decisions are made solely by you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Account Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  To use the Platform, you must create an account and provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
                <p>
                  You must be at least 18 years old and legally capable of entering into binding contracts in your jurisdiction to use the Platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Share Ownership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  When you purchase shares through the Platform, you acquire fractional ownership rights in the underlying property. Share ownership is recorded on the Platform and entitles you to proportional distributions from rental income.
                </p>
                <p>
                  Shares may have restrictions on transferability. You may not transfer shares without Platform approval and compliance with applicable laws and regulations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Distributions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Distributions are calculated monthly based on net rental income after deducting operating costs and management fees. Distributions are made proportionally based on share ownership.
                </p>
                <p>
                  Distribution amounts may vary from month to month and are not guaranteed. There may be periods with no distributions if properties do not generate sufficient income.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Various fees may apply, including platform fees, management fees, and other costs. All fees are disclosed before you complete an investment. Fees are subject to change with notice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  To the maximum extent permitted by law, InventWealth and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  Our total liability shall not exceed the amount you have invested through the Platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Indemnification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You agree to indemnify and hold harmless InventWealth and its affiliates from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform or violation of these Terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may suspend or terminate your account and access to the Platform at any time for violation of these Terms or for any other reason at our discretion.
                </p>
                <p>
                  Termination does not affect your ownership of shares or rights to distributions, subject to applicable terms and conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration or in courts of competent jurisdiction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>13. Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  For questions about these Terms, please contact us at{" "}
                  <a
                    href="mailto:support@inventwealth.com"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    support@inventwealth.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

