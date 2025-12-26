import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://inventwealth.com";

  const routes = [
    "",
    "/how-it-works",
    "/properties",
    "/fees",
    "/faq",
    "/about",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
    "/auth/signin",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/properties" ? 0.9 : 0.7,
  }));
}

