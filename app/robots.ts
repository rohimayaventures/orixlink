import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/account",
        "/history",
        "/family",
        "/admin",
        "/api/",
      ],
    },
    sitemap: "https://triage.rohimaya.ai/sitemap.xml",
  };
}
