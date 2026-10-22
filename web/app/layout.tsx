import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import Script from "next/script";
import { AdSenseScript } from "./components/AdSenseScript";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const lora = Lora({ variable: "--font-serif", subsets: ["latin"] });
const siteUrl = "https://deenislam.app";
const siteName = "DEEN ISLAM QURAN & HADITH - MUSLIM GUIDE & PATH";
const siteDescription = [
  "Deen Islam is a complete Islamic lifestyle app designed to help Muslims stay connected with Islam in their everyday lives. The app brings essential Islamic knowledge, worship tools, and daily guidance together in one simple, clean, modern, and user-friendly platform.",
  "Users can read and listen to the Holy Quran, explore Hadith, Tafsir, Fiqh, Aqidah, Seerah, Islamic history, and Islamic books, check accurate daily prayer times, find the Qibla direction, use a digital Tasbih, and follow daily Islamic tasks and activities to build better habits.",
  "Deen Islam also provides Daily Ayah, Hadith of the Day, prayer reminders, Hijri date information, Ramadan Sehri and Iftar times, Islamic events, and useful reminders for daily life.",
  "With easy navigation and a beautiful modern design, Deen Islam makes Islamic learning and daily practice easier. It aims to become a trusted digital companion for Muslims who want to increase their knowledge, improve their worship, build good Islamic habits, and stay connected with their faith anytime and anywhere.",
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteName,
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
        <link rel='manifest' href='/manifest.webmanifest' />
        <link rel='icon' type='image/png' href='/deen-islam-app-icon.png' />
        <link rel='apple-touch-icon' href='/deen-islam-app-icon.png' />
        <meta name='google-adsense-account' content='ca-pub-8168876753473960' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script id='google-tag-manager' strategy='beforeInteractive'>
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-MPD7JJJ3');`}
        </Script>
      </head>
      <body className={`${geist.variable} ${lora.variable}`}>
        <AdSenseScript />
        <noscript>
          <iframe
            src='https://www.googletagmanager.com/ns.html?id=GTM-MPD7JJJ3'
            height='0'
            width='0'
            style={{ display: "none", visibility: "hidden" }}
            title='Google Tag Manager'
          />
        </noscript>
        {children}
        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-EG5N3GPH9E'
          strategy='afterInteractive'
        />
        <Script id='google-analytics' strategy='afterInteractive'>
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-EG5N3GPH9E');`}
        </Script>
        <Script id='microsoft-clarity' strategy='afterInteractive'>
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "yyf3uuhd7i");`}
        </Script>
      </body>
    </html>
  );
}
