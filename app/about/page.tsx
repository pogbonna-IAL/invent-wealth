import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContent, type AboutContent } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - InventWealth | Fractional Property Investment Platform",
  description: "Learn about InventWealth's mission to democratize real estate investment through fractional property ownership.",
  openGraph: {
    title: "About Us - InventWealth",
    description: "Our mission to make real estate investment accessible to everyone.",
    type: "website",
  },
};

export default function AboutPage() {
  // Load content from content/about.json
  const content = getContent<AboutContent>("about");

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h1>
            <p className="text-xl text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {/* Mission */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{content.mission.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.mission.content.map((paragraph, index) => (
                <p key={index} className={`text-muted-foreground ${index > 0 ? '' : 'mb-4'}`}>
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>

          {/* What We Do */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{content.whatWeDo.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.whatWeDo.content.map((paragraph, index) => (
                <p key={index} className={`text-muted-foreground ${index > 0 ? 'mt-4' : ''}`}>
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{content.values.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {content.values.items.map((value, index) => (
                  <div key={index}>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Vetting Process */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Property Vetting Process</CardTitle>
              <CardDescription>How we select properties for the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">1. Market Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    We analyze local rental markets, demand trends, and competitive positioning to identify areas with strong short-term rental potential.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">2. Property Evaluation</h3>
                  <p className="text-sm text-muted-foreground">
                    Properties undergo thorough evaluation including physical inspection, condition assessment, and compliance verification.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">3. Financial Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    We project rental income, operating costs, and returns based on market data and comparable properties to ensure viable investment opportunities.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">4. Management Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    We evaluate property management capabilities and ensure professional management services are available to maintain property performance.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">5. Legal & Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    All properties must meet legal and regulatory requirements, and ownership structures are properly documented and compliant.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Have questions about InventWealth or want to learn more? We're here to help.
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@inventwealth.com"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    support@inventwealth.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  For general inquiries, investment questions, or support, please reach out via email. We typically respond within 24-48 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketingLayout>
  );
}

