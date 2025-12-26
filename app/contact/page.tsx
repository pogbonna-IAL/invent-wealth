import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - InventWealth | Get in Touch",
  description: "Contact InventWealth for questions about fractional property ownership, investments, or platform support.",
  openGraph: {
    title: "Contact Us - InventWealth",
    description: "Get in touch with our team for support and inquiries.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground">
              Have questions? We're here to help
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action="mailto:support@inventwealth.com" method="post">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                    className="focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    className="focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="What is this regarding?"
                    required
                    className="focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="Your message..."
                    required
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button type="submit" className="w-full focus-visible:ring-2">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:support@inventwealth.com"
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  support@inventwealth.com
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  For general inquiries, investment questions, or platform support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We typically respond to all inquiries within 24-48 hours during business days. For urgent matters, please include "URGENT" in your subject line.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold">Note:</strong> For security and privacy reasons, please do not include sensitive personal or financial information in your initial contact. Our team will guide you through secure channels for any sensitive matters.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

