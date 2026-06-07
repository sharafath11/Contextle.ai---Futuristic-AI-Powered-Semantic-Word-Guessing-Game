import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ─── Site Constants ───────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://contextle.ai";
const SITE_NAME = "Contextle.ai";
const SITE_DESCRIPTION =
  "The AI-powered word guessing game. Each day a new secret word — use AI semantic similarity to hunt it down. How close can you get?";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// ─── Global Metadata ─────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: "Contextle.ai — The AI Semantic Word Guessing Game",
    template: "%s | Contextle.ai",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "contextle",
    "AI word game",
    "semantic word game",
    "daily word game",
    "wordle alternative",
    "contexto inspired",
    "word similarity game",
    "Gemini AI game",
    "word guessing game 2025",
    "NLP word puzzle",
  ],
  authors: [{ name: "Contextle.ai Team", url: SITE_URL }],
  creator: "Contextle.ai",
  publisher: "Contextle.ai",

  // ── Canonical & Robots ────────────────────────────────────────────────────
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "en_AU"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Contextle.ai — The AI Semantic Word Guessing Game",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contextle.ai – Guess the daily secret word using AI-powered semantic similarity",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Cards ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@contextleai",
    creator: "@contextleai",
    title: "Contextle.ai — The AI Semantic Word Guessing Game",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        alt: "Contextle.ai – Daily AI word guessing game",
      },
    ],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // ── Manifest ──────────────────────────────────────────────────────────────
  manifest: "/site.webmanifest",

  // ── Verification ──────────────────────────────────────────────────────────
  // verification: { google: "YOUR_GSC_VERIFICATION_TOKEN" },

  // ── Category ──────────────────────────────────────────────────────────────
  category: "games",
};

// ─── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className="font-inter antialiased bg-neutral-950 text-neutral-100 selection:bg-violet-500/40 selection:text-violet-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
