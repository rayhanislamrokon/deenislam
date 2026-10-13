import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEEN ISLAM QURAN & HADITH - MUSLIM GUIDE & PATH",
    short_name: "Deen Islam",
    description:
      "Quran, authentic Hadith, prayer times, duas and Islamic learning in one Muslim guide.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7fbf8",
    theme_color: "#006a4e",
    orientation: "any",
    icons: [
      {
        src: "/images/deen-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
