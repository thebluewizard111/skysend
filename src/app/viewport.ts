import type { Viewport } from "next";
import { siteConfig } from "@/constants/site";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor },
    { media: "(prefers-color-scheme: dark)", color: "#101a29" },
  ],
};
