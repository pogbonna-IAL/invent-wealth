import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - InventWealth | Data Protection",
  description: "Read InventWealth's privacy policy to understand how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy - InventWealth",
    description: "How we protect and use your personal information.",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  InventWealth ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
                <p>
                  By using the Platform, you consent to the data practices described in this Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                  <p>We collect information you provide directly, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name, email address, phone number</li>
                    <li>Date of birth and identification information</li>
                    <li>Address and contact details</li>
                    <li>Financial information for investment transactions</li>
                    <li>Account credentials</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Usage Information</h3>
                  <p>We automatically collect information about your use of the Platform, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Device information and IP address</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent</li>
                    <li>Referring website addresses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We use collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, operate, and maintain the Platform</li>
                  <li>Process investments and manage your account</li>
                  <li>Calculate and distribute rental income</li>
                  <li>Send you account updates and investment statements</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Improve and optimize the Platform</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Information Sharing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We do not sell your personal information. We may share information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, property management, etc.)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your information, including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and updates</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p>
                  However, no method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We retain your personal information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Financial records may be retained longer as required by law.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>
                <p>
                  To exercise these rights, please contact us at{" "}
                  <a
                    href="mailto:support@inventwealth.com"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    support@inventwealth.com
                  </a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with marketing efforts. You can control cookies through your browser settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  The Platform is not intended for individuals under 18 years of age. We do not knowingly collect information from children.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. International Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the "Last updated" date.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  For questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p>
                  <strong>Email:</strong>{" "}
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

