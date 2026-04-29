export { roleConfigs } from "@/constants/roles";

export const siteConfig = {
  name: "SkySend",
  shortName: "SkySend",
  description:
    "Premium urban drone logistics platform for same-hour delivery, fleet visibility, and city-scale operations.",
  url: "https://skysend.example",
  themeColor: "#0f9bd7",
  backgroundColor: "#f4f7fb",
  supportEmail: "ops@skysend.example",
} as const;

export const platformMetrics = [
  {
    label: "Dispatch Latency",
    value: "< 90 sec",
    hint: "Prepared for automated routing and launch assignment flows.",
  },
  {
    label: "Coverage Mode",
    value: "Pitesti only",
    hint: "Current service area is limited to municipiul Pitesti, with a replaceable geo coverage model.",
  },
  {
    label: "Role Surfaces",
    value: "3 dashboards",
    hint: "Client, admin, and operator workspaces share one typed core.",
  },
] as const;

export const platformCapabilities = [
  "Role-based routing is already isolated behind dedicated dashboard entry points.",
  "PWA metadata is scaffolded now so installability can be added without a structural rewrite.",
  "Design tokens, constants, and types are centralized before feature growth starts.",
  "Service availability is currently restricted to municipiul Pitesti, with fallback radius logic ready for a future polygon model.",
] as const;
