import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalNav from "@/components/shared/GlobalNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Network Simulator",
  description: "ネットワーク初学者向け学習シミュレーター",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <GlobalNav />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
