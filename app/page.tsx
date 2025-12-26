import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/json-ld";
import { getContent, type HomeContent } from "@/lib/content";
import { PartnersSection } from "@/components/marketing/partners-section";
import { SocialProof } from "@/components/marketing/social-proof";
import { WhatsAppCTA } from "@/components/marketing/whatsapp-cta";
import { SocialShare } from "@/components/marketing/social-share";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InventWealth - Fractional Property Ownership | Invest in Real Estate",
  description: "Invest in premium properties through fractional ownership. Start with as little as ₦600,000 ($400), earn passive income from shortlet rentals, and build wealth through real estate.",
  keywords: ["fractional property ownership", "real estate investment", "property investment", "rental income", "passive income", "real estate"],
  openGraph: {
    title: "InventWealth - Fractional Property Ownership",
    description: "Invest in premium properties through fractional ownership and earn passive income.",
    type: "website",
    url: "https://inventwealth.com",
    siteName: "InventWealth",
  },
  twitter: {
    card: "summary_large_image",
    title: "InventWealth - Fractional Property Ownership",
    description: "Invest in premium properties through fractional ownership and earn passive income.",
  },
};

export default function Home() {
  // Load content from content/home.json
  const content = getContent<HomeContent>("home");

  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <MarketingLayout>
        <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 md:py-32 text-center overflow-hidden">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative">
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge variant="outline" className="px-4 py-1.5 border-green-500 text-green-700 dark:text-green-400">
              <Shield className="h-3 w-3 mr-1.5" />
              SCUML Registered
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 border-blue-500 text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="h-3 w-3 mr-1.5" />
              Licensed Trustees Partner
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 border-orange-500 text-orange-700 dark:text-orange-400">
              <TrendingUp className="h-3 w-3 mr-1.5" />
              Monthly Returns
            </Badge>
          </div>

          <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold text-rich-xl leading-tight">
            {content.hero.title}
            <br />
            <span className="text-gradient-rich">
              {content.hero.subtitle}
            </span>
          </h1>
          <p className="mb-8 text-lg md:text-xl text-muted-rich max-w-2xl mx-auto leading-relaxed">
            {content.hero.description}
          </p>

          {/* Key Benefits - Quick Scan */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Start from ₦600,000</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Monthly Distributions</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No Management Hassle</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Fully Transparent</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/properties">
              <Button size="lg" className="shadow-brand hover:shadow-lg transition-all duration-300 text-base px-8">
                {content.hero.cta.primary}
              </Button>
            </Link>
            <WhatsAppCTA className="text-base px-8" />
          </div>

          {/* Social Share */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Share this opportunity:</span>
            <SocialShare />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Partners Section */}
      <PartnersSection />

      {/* Features Section - Simplified */}
      <section className="container mx-auto px-4 py-20 md:py-24">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight">
            {content.features.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build wealth through real estate, simplified
          </p>
        </div>
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {content.features.items.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-[#F58220]/50 transition-all duration-300 hover:shadow-xl group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F58220]/20 to-[#F58220]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {index === 0 && <TrendingUp className="h-6 w-6 text-[#F58220]" />}
                  {index === 1 && <Clock className="h-6 w-6 text-[#F58220]" />}
                  {index === 2 && <Shield className="h-6 w-6 text-[#F58220]" />}
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-base font-medium">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works - Visual Flow */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight">{content.howItWorks.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start investing in just 4 simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            {content.howItWorks.steps.map((step, index) => (
              <div key={step.number} className="text-center group relative">
                {/* Connector Line */}
                {index < content.howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#F58220]/30 to-transparent" />
                )}
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F58220] to-[#F58220]/80 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <span className="text-xl font-bold">{step.number}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="outline" size="lg">
                Learn More About the Process
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Conversion Focused */}
      <section className="relative container mx-auto px-4 py-20 md:py-32 text-center overflow-hidden">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F58220]/10 via-primary/5 to-accent/10" />
        <div className="relative max-w-3xl mx-auto">
          <Badge className="mb-4 bg-[#F58220] text-white border-none">
            Limited Properties Available
          </Badge>
          <h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight">{content.cta.title}</h2>
          <p className="mb-8 text-lg md:text-xl text-muted-foreground leading-relaxed">
            {content.cta.description}
          </p>
          
          {/* Multiple CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/properties">
              <Button size="lg" className="shadow-brand hover:shadow-lg transition-all duration-300 bg-[#F58220] hover:bg-[#F58220]/90 text-white border-none text-base px-8">
                Browse Properties Now
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="border-2 hover:bg-accent/10 hover:border-accent transition-all duration-300 text-base px-8">
                {content.cta.button}
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Secure & Regulated</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Quick Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-600" />
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>
      </section>
    </div>
      </MarketingLayout>
    </>
  );
}
