import type { Metadata, Viewport } from "next";
import { Geist, Lora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import WebPushNotifications from "./components/WebPushNotifications";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const lora = Lora({ variable: "--font-serif", subsets: ["latin"] });
const siteUrl = "https://www.deenislam.app";
const siteName = "Deen Islam";
const siteTitle = "Deen Islam - Quran, Hadith, Dua & Islamic Guide";
const siteDescription =
  "Explore the Holy Quran, authentic Hadith, daily Duas, prayer times, Qibla direction, Tafsir, Islamic books, Zakat and Islamic AI with Deen Islam.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B6B50",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "Deen Islam",
  authors: [{ name: "Deen Islam", url: siteUrl }],
  creator: "Deen Islam",
  publisher: "Deen Islam",
  category: "Religion and Spirituality",
  keywords: [
    "Deen Islam",
    "Al Quran Online",
    "Quran Bangla",
    "Authentic Hadith",
    "Islamic Books",
    "Daily Dua",
    "Namaz Time",
    "Prayer Times",
    "Qibla Direction",
    "Islamic AI",
    "Tafsir",
    "Zakat Calculator",
    "Islamic Calendar",
    "Ramadan 2027",
    "Islamic Knowledge",
  ],
  referrer: "origin-when-cross-origin",
  alternates: { canonical: `${siteUrl}/` },
  formatDetection: { email: false, address: false, telephone: false },
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
    title: "Deen Islam - Quran, Hadith & Islamic Guide",
    description:
      "Strengthen your Deen every day. Read Quran, explore authentic Hadith, daily Duas, prayer times, Islamic books and more.",
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
    title: "Deen Islam - Your Daily Islamic Guide",
    description:
      "Read Quran, Hadith, Dua, Tafsir and Islamic books. Explore prayer times, Qibla direction and Islamic knowledge.",
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
  const production = process.env.NODE_ENV === "production";
  return (
    <html lang='en'>
      <head>
        <link
          rel='icon'
          type='image/png'
          href='/deen-islam-app-icon.png'
        />
        <link rel='apple-touch-icon' href='/deen-islam-app-icon.png' />
        <meta
          name='google-adsense-account'
          content='ca-pub-8168876753473960'
        />
        {production && (
          <Script
            async
            src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8168876753473960'
            crossOrigin='anonymous'
            strategy='afterInteractive'
          />
        )}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {production && (
          <Script id='google-tag-manager' strategy='beforeInteractive'>
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-MPD7JJJ3');`}
          </Script>
        )}
      </head>
      <body className={`${geist.variable} ${lora.variable}`}>
        {production && (
          <noscript>
            <iframe
              src='https://www.googletagmanager.com/ns.html?id=GTM-MPD7JJJ3'
              height='0'
              width='0'
              style={{ display: "none", visibility: "hidden" }}
              title='Google Tag Manager'
            />
          </noscript>
        )}
        {children}
        <WebPushNotifications />
        {production && (
          <>
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
          </>
        )}
      </body>
    </html>
  );
}
