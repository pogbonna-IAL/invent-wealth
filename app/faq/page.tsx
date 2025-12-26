import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getContent, type FAQContent } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - InventWealth | FAQ",
  description: "Find answers to common questions about fractional property ownership, investments, distributions, and how InventWealth works.",
  openGraph: {
    title: "FAQ - InventWealth",
    description: "Common questions about fractional property ownership and investing.",
    type: "website",
  },
};

export default function FAQPage() {
  // Load FAQ content from content/faq.json
  let faqContent: FAQContent;
  try {
    faqContent = getContent<FAQContent>("faq");
  } catch (error) {
    console.error("Error loading FAQ content:", error);
    // Return a fallback page if content fails to load
    return (
      <MarketingLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              We're currently updating our FAQ section. Please check back soon or contact us directly.
            </p>
            <a
              href="mailto:support@inventwealth.com"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              support@inventwealth.com
            </a>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  const faqs = faqContent?.categories || [];

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about fractional property ownership
            </p>
          </div>

          {faqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No FAQ content available at this time.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => {
                if (!category || !category.name) return null;
                const categoryKey = category.name.replace(/\s+/g, "-").toLowerCase() || `category-${categoryIndex}`;
                const questions = category.questions || [];
                return (
                  <div key={categoryKey}>
                    <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
                    {questions.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {questions.map((faq, index) => {
                          if (!faq || !faq.q) return null;
                          const itemValue = `${categoryKey}-${index}`;
                          return (
                            <AccordionItem
                              key={itemValue}
                              value={itemValue}
                            >
                              <AccordionTrigger className="text-left">
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {faq.a || "Answer not available."}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <p className="text-muted-foreground">No questions in this category.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 p-6 bg-muted rounded-lg text-center">
            <p className="font-semibold mb-2">Still have questions?</p>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is here to help. Reach out to us anytime.
            </p>
            <a
              href="mailto:support@inventwealth.com"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              support@inventwealth.com
            </a>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

