export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "InventWealth",
    url: "https://inventwealth.com",
    logo: "https://inventwealth.com/logo.png",
    description: "Fractional property ownership platform enabling investors to invest in premium properties and earn passive income from rental income.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@inventwealth.com",
      contactType: "Customer Service",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "InventWealth",
    url: "https://inventwealth.com",
    description: "Fractional property ownership platform",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://inventwealth.com/properties?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({
  name,
  description,
  price,
  priceCurrency = "USD",
  availability = "https://schema.org/InStock",
  url,
}: {
  name: string;
  description: string;
  price: string;
  priceCurrency?: string;
  availability?: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
      availability,
      url,
      // Important: We're careful not to make financial promises
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

