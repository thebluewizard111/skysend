import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Sora } from "next/font/google";
import { isClerkFrontendConfigured } from "@/lib/clerk-config";
import { defaultMetadata } from "@/lib/metadata";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

export const metadata = defaultMetadata;

const clerkEnabled = isClerkFrontendConfigured();

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen overflow-x-hidden font-sans antialiased">
        {clerkEnabled ? (
          <ClerkProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            {children}
          </ClerkProvider>
        ) : (
          <>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            {children}
          </>
        )}
      </body>
    </html>
  );
}
