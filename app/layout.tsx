import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AppToaster } from "@/components/providers/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "WedPlan — Wedding Planning Platform",
    template: "%s | WedPlan",
  },
  description:
    "Discover trusted wedding venues, photographers, decorators, caterers, makeup artists, and fashion vendors. Plan your perfect day with WedPlan.",
  keywords: [
    "wedding planning",
    "wedding vendors",
    "wedding services",
    "wedding venues",
    "wedding photography",
    "WedPlan",
  ],
  openGraph: {
    type: "website",
    siteName: "WedPlan",
    title: "WedPlan — Wedding Planning Platform",
    description:
      "Discover trusted wedding vendors and book the services that make your day unforgettable.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "WedPlan — Wedding Planning Platform",
    description:
      "Discover trusted wedding vendors and book the services that make your day unforgettable.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1719" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        playfair.variable,
      )}
    >
      <body className="min-h-svh">
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <div className="flex min-h-svh flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <AppToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
