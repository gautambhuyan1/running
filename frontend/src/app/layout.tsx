import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MYMove - India's Running Event Platform",
  description: "Discover, register, and manage running events across India. Find marathons, half marathons, 10K, 5K races near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F5] text-[#1C1917]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
