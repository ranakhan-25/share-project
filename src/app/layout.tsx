import type { Metadata, Viewport } from "next";
import {
  Hind_Siliguri,
  Plus_Jakarta_Sans,
  Playfair_Display, // 🎯 নতুন Serif ফন্ট
  Pinyon_Script, // 🎯 নতুন Script ফন্ট
} from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

// 🎯 Playfair Display কনফিগার
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// 🎯 Pinyon Script কনফিগার
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Share Project — শেয়ারে গড়ুন ভবিষ্যৎ",
    template: "%s | Share Project",
  },
  description:
    "Share Project — a transparent platform to own, track and grow project shares. স্বচ্ছভাবে প্রজেক্ট শেয়ার কিনুন, ট্র্যাক করুন ও বাড়ান।",
};

export const viewport: Viewport = {
  themeColor: "#060a16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${jakarta.variable} ${hind.variable} ${playfair.variable} ${pinyon.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-screen antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
