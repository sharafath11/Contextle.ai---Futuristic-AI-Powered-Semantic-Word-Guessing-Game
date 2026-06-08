import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://contextle.online";
const SITE_NAME = "Contextle.ai";
const SITE_DESCRIPTION =
  "Play Contextle.ai, the ultimate futuristic AI word game. Guess the secret word using real-time semantic similarity ranks and dynamic AI clue stories. Challenge your brain daily!";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// ─── Global Metadata ─────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: "Contextle - Ultimate AI Guess Word Game Online",
    template: "%s | Contextle",
  },
  description: "Looking for the best guess word game online? Challenge your vocabulary with Contextle. Guess the secret word daily using immersive, AI-generated context clue stories. Play for free!",
  keywords: [
    "guess word game",
    "guess word game online",
    "contextle",
    "ai word puzzle",
    "daily word guessing game",
    "wordle alternative",
    "context clues game",
    "free online word game"
  ],
  authors: [{ name: "Contextle Team", url: SITE_URL }],
  creator: "Contextle",
  publisher: "Contextle",

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
    url: "https://contextle.online",
    siteName: "Contextle",
    title: "Contextle - Ultimate AI Guess Word Game Online",
    description: "Play the ultimate guess word game online! Crack the code and guess the secret word daily using smart AI context clues.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contextle – Guess the daily secret word using AI-powered semantic similarity",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Cards ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@contextleai",
    creator: "@contextleai",
    title: "Contextle - Free Guess Word Game Online",
    description: "Can you solve the puzzle? Play the best AI-powered guess word game online now!",
    images: [
      {
        url: OG_IMAGE,
        alt: "Contextle – Daily AI word guessing game",
      },
    ],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // ── Manifest ──────────────────────────────────────────────────────────────
  manifest: "/site.webmanifest",

  // ── Verification ──────────────────────────────────────────────────────────
  verification: {
    google: 'google-site-verification: google839c9735c5dad756.html',
  },
  other: {
    "google-adsense-account": "ca-pub-8175902243591443",
  },

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
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8175902243591443"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="font-inter antialiased bg-neutral-950 text-neutral-100 selection:bg-violet-500/40 selection:text-violet-100"
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-QNCFTWNNC6" />
      </body>
    </html>
  );
}
