import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Public site address. Defaults to the Vercel URL until modgeto.com is registered;
// set SITE_URL in Vercel to switch without a code change.
const siteUrl = process.env.SITE_URL ?? "https://modgeto.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Modgeto | One link to start working with you.",
    template: "%s | Modgeto",
  },
  description:
    "Modgeto helps independent Creatives package their Services, pricing, Project requirements and working terms into one personalized link that Clients can use to start a Project.",
  applicationName: "Modgeto",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Modgeto",
    title: "Modgeto | One link to start working with you.",
    description:
      "Services, Briefs and Project starts for independent Creatives. Modgeto is preparing for launch.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modgeto | One link to start working with you.",
    description:
      "Services, Briefs and Project starts for independent Creatives. Modgeto is preparing for launch.",
  },
};

export const viewport: Viewport = {
  // Lets env(safe-area-inset-*) clear the notch and home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#05060f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
