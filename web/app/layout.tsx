import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const lora = Lora({ variable: "--font-serif", subsets: ["latin"] });
const siteUrl = "https://deenislam.app";
const siteName = "DEEN ISLAM QURAN & HADITH - MUSLIM GUIDE & PATH";
const siteDescription =
  "Read the Quran, explore authentic Hadith, check prayer times, learn duas and Islamic history, and strengthen your Deen with a complete Muslim guide.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: "Deen Islam",
  authors: [{ name: "Deen Islam", url: siteUrl }],
  creator: "Deen Islam",
  publisher: "Deen Islam",
  category: "Religion and Spirituality",
  keywords: [
    "Deen Islam",
    "Quran",
    "Holy Quran",
    "Hadith",
    "Muslim guide",
    "Islamic app",
    "prayer times",
    "Qibla direction",
    "daily duas",
    "Islamic books",
    "Tafsir",
    "Prophets",
    "Sahaba",
    "Islamic history",
  ],
  referrer: "origin-when-cross-origin",
  alternates: { canonical: "/", languages: { "en-US": "/", "bn-BD": "/" } },
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Deen Islam",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    images: [
      {
        url: "/images/deen-islam-social.png",
        width: 1200,
        height: 630,
        alt: "Deen Islam Quran and Hadith Muslim Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/images/deen-islam-social.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Deen Islam",
      url: siteUrl,
      logo: `${siteUrl}/images/deen-logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["en", "bn"],
    },
    {
      "@type": "WebApplication",
      name: "Deen Islam",
      url: siteUrl,
      description: siteDescription,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geist.variable} ${lora.variable}`}>{children}</body>
    </html>
  );
}
