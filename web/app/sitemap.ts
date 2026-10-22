import type { MetadataRoute } from "next";

const routes = [
  "",
  "/quran",
  "/hadith",
  "/islamic-books",
  "/prayer-times",
  "/qibla-direction",
  "/islamic-ai",
  "/daily-tasks",
  "/tafsir",
  "/zakat",
  "/islamic-lifestyle",
  "/prophets",
  "/sahaba",
  "/islamic-history",
  "/tasbih",
  "/duas-and-amol",
  "/about-us",
  "/help-center",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route, index) => ({
    url: `https://deenislam.app${route}`,
    lastModified,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
