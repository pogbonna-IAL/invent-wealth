"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface Partner {
  name: string;
  logo: string;
  description?: string;
  category: "Regulatory" | "Trustee" | "Investment" | "Platform" | "Association" | "Technology";
  website?: string;
}

const partners: Partner[] = [
  {
    name: "SCUML-EFCC",
    logo: "/partners/scuml-logo.png",
    description: "Special Control Unit Against Money Laundering (SCUML) - Economic and Financial Crimes Commission (EFCC). InventWealth is fully registered and compliant with SCUML under the EFCC. We maintain active anti-money laundering (AML) and combating the financing of terrorism (CFT) compliance certification as required by Nigerian law.",
    category: "Regulatory",
  },
  {
    name: "CardinalStone Trustees",
    logo: "/partners/cardinalstone-logo.png",
    description: "Trustee Service and Custodian Partner. CardinalStone Trustees provides licensed corporate trustee services and acts as custodian for investor assets, ensuring secure and compliant management of investments in accordance with SEC regulations.",
    category: "Trustee",
  },
  {
    name: "Investment One",
    logo: "/partners/investment-one-logo.png",
    description: "Property Development Financing Partner. Investment One provides comprehensive asset management and investment services, specializing in property development financing. They support real estate projects through structured financing solutions and investment management expertise.",
    category: "Investment",
  },
  {
    name: "REDAN",
    logo: "/partners/redan-logo.svg",
    description: "Registered Real Estate Development Organisation Membership and Industry Sector Self-Regulator. REDAN (Real Estate Developers Association of Nigeria) is the registered industry association for real estate developers in Nigeria. As a self-regulatory organization, REDAN sets standards, promotes best practices, and ensures compliance within the real estate development sector.",
    category: "Association",
  },
  {
    name: "Airbnb",
    logo: "/partners/airbnb-logo.svg",
    description: "Shortlet Accommodation Marketing Channel Partner. Airbnb serves as our primary marketing channel partner for shortlet accommodation bookings. Through Airbnb's global platform, we maximize rental income and occupancy rates for our property investments, connecting our properties with millions of travelers worldwide.",
    category: "Platform",
  },
  {
    name: "Mbava",
    logo: "/partners/mbava-logo.svg",
    description: "SEC Investment Compliance Partner. Mbava provides property management technology solutions and ensures SEC investment compliance. They offer comprehensive compliance monitoring, reporting, and technology infrastructure to support regulated investment activities in accordance with SEC regulations.",
    category: "Technology",
  },
];

export function PartnersSection() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-collapse tooltip when card scrolls out of view
  useEffect(() => {
    if (!expandedPartner) return;

    const cardElement = cardRefs.current.get(expandedPartner);
    if (!cardElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If the card is not intersecting (out of view), collapse the tooltip
          if (!entry.isIntersecting && expandedPartner) {
            setExpandedPartner(null);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when less than 10% of the card is visible
        rootMargin: "50px", // Add some margin to account for tooltip height
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.disconnect();
    };
  }, [expandedPartner]);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Trusted Partners & Regulators</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We work with leading financial institutions, regulatory bodies, and technology partners to ensure transparency, security, and compliance in all our operations.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {partners.map((partner) => {
            const hasError = imageErrors.has(partner.name);
            const isExpanded = expandedPartner === partner.name;
            return (
              <div
                key={partner.name}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(partner.name, el);
                  } else {
                    cardRefs.current.delete(partner.name);
                  }
                }}
                className="relative"
              >
                <Card
                  className="group relative flex flex-col items-center justify-center p-6 h-32 md:h-40 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-background/50 backdrop-blur-sm cursor-pointer"
                  onClick={() => {
                    setExpandedPartner(isExpanded ? null : partner.name);
                  }}
                >
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
                  {hasError ? (
                    <span className="text-sm font-semibold text-center text-muted-foreground group-hover:text-primary transition-colors px-2">
                      {partner.name}
                    </span>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                      <div className="flex-1 flex items-center justify-center">
                        <Image
                          src={partner.logo}
                          alt={`${partner.name} logo`}
                          width={120}
                          height={60}
                          className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                          onError={() => {
                            setImageErrors((prev) => new Set(prev).add(partner.name));
                          }}
                        />
                      </div>
                      {/* Text labels integrated with logos */}
                      {(partner.name === "CardinalStone Trustees" || partner.name === "Investment One") && (
                        <p className="text-xs font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors leading-tight px-1">
                          {partner.name === "CardinalStone Trustees" ? "CardinalStone Trustees" : "Investment One Finance"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* Details shown on click */}
                {isExpanded && partner.description && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-80 max-w-[90vw] bg-foreground text-background text-xs px-4 py-4 rounded-md shadow-lg">
                    <p className="font-semibold mb-2 text-sm">{partner.name}</p>
                    <div className="space-y-2 opacity-90 leading-relaxed">
                      <p>{partner.description}</p>
                      {partner.name === "SCUML-EFCC" && (
                        <div className="pt-2 border-t border-background/20">
                          <p className="font-semibold mb-1.5 text-xs">Anti-Money Laundering Compliance Certificate:</p>
                          <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                            <li>Registered with SCUML under EFCC</li>
                            <li>Active AML/CFT compliance certification</li>
                            <li>Full regulatory compliance maintained</li>
                            <li>Certificate documentation available upon request</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
              </div>
            );
          })}
        </div>

        {/* Partner Categories */}
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { label: "Regulatory Compliance", icon: "🛡️" },
              { label: "Licensed Trustees Partner", icon: "🏛️" },
              { label: "Investment Partners", icon: "💼" },
              { label: "Industry Associations", icon: "🤝" },
              { label: "Rental Platforms", icon: "🏠" },
              { label: "Technology Partners", icon: "⚡" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All investments are held in segregated accounts and managed in compliance with{" "}
            <span className="font-semibold text-foreground">SEC regulations</span> and{" "}
            <span className="font-semibold text-foreground">anti-money laundering</span> requirements.
          </p>
        </div>
      </div>
    </section>
  );
}

