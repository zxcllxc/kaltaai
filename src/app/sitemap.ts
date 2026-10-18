import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://kaltaai.vercel.app/", changeFrequency: "weekly", priority: 1 },
    { url: "https://kaltaai.vercel.app/pitch", changeFrequency: "weekly", priority: 0.8 },
  ];
}
