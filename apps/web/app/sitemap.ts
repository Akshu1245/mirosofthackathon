import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rakshex.in";
// Only promote the current product focus. Existing legacy routes remain available.
const routes = ["", "/features", "/faq", "/about", "/pricing", "/waitlist", "/privacy", "/terms", "/trust", "/changelog", "/status", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
