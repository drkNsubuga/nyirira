import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Nyirira | Safe Skin Insights for Melanin-Rich Skin",
    template: "%s | Nyirira",
  },
  description:
    "Nyirira helps users in Uganda and beyond get safe skincare diagnostics and color-matched virtual beauty recommendations for melanin-rich skin.",
  applicationName: "Nyirira",
  keywords: [
    "skincare",
    "Uganda skincare",
    "melanin-rich skin",
    "Fitzpatrick V-VI",
    "skin analysis",
    "virtual try-on",
    "beauty matching",
    "Kitenge colors",
    "safe skincare",
  ],
  openGraph: {
    title: "Nyirira",
    description:
      "Safe skincare diagnostics and virtual beauty matching designed for melanin-rich skin and local Ugandan aesthetics.",
    url: "/",
    siteName: "Nyirira",
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nyirira",
    description:
      "Safe skin insights and beauty matching tuned for melanin-rich skin types.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nyirira_theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
