import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/change-password", "/reset-password"],
    },
    sitemap: "https://zevio.in/sitemap.xml",
  };
}
