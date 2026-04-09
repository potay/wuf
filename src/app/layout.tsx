import type { Metadata, Viewport } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wuf - Toro's Tracker",
  description: "Puppy management app for Toro",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wuf",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e8913a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <main className="flex-1 pb-20 scroll-touch">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
