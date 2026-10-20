import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdminHeaderTools from "./components/AdminHeaderTools";
import AdminPermissionGuard from "./components/AdminPermissionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeenIslam Admin",
  description: "Secure web control panel for the DeenIslam app.",
  icons: {
    icon: [{ url: "/deen-islam-app-icon.png", type: "image/png" }],
    shortcut: "/deen-islam-app-icon.png",
    apple: "/deen-islam-app-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <AdminHeaderTools />
        <AdminPermissionGuard />
      </body>
    </html>
  );
}
