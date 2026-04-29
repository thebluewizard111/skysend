export type PublicPageContent = {
  title: string;
  description: string;
  eyebrow: string;
  summary: string;
  pillars: {
    title: string;
    body: string;
  }[];
};

export const publicPageContent = {
  howItWorks: {
    eyebrow: "How It Works",
    title: "A clear operating journey from request to rooftop delivery.",
    description:
      "SkySend keeps the flow direct: create the delivery, confirm the active zone, release dispatch and follow the order to handoff.",
    summary:
      "This page explains the current delivery flow in practical terms, using the same language a live logistics product would use.",
    pillars: [
      {
        title: "Order creation",
        body: "The flow starts with pickup, drop-off, parcel profile and a check against the active Pitesti zone.",
      },
      {
        title: "Dispatch validation",
        body: "Routing, corridor availability and fleet fit are checked before the mission is released.",
      },
      {
        title: "Delivery confirmation",
        body: "Customers can track ETA, live state and final delivery confirmation without extra steps.",
      },
    ],
  },
  coverage: {
    eyebrow: "Coverage",
    title: "Coverage should feel precise, not noisy.",
    description:
      "Coverage is live now for municipal Pitesti and is limited to the current active zone.",
    summary:
      "Coverage stays focused on what matters now: where the service works today, how the zone is bounded and how to verify an address.",
    pillars: [
      {
        title: "City sectors",
        body: "Shows which parts of Pitesti are inside the current live delivery area.",
      },
      {
        title: "Operating windows",
        body: "Used for daily service hours, weather constraints and dispatch availability.",
      },
      {
        title: "Network readiness",
        body: "Used for launch points, fallback corridors and service continuity notes.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Pricing surfaces should stay comparable and calm.",
    description:
      "Pricing keeps the service understandable for current Pitesti operations and larger commercial accounts.",
    summary:
      "The pricing surface is meant to read like part of an active service, not a startup sales page.",
    pillars: [
      {
        title: "Active city plans",
        body: "Covers current-city delivery use, standard operating volumes and active service tiers.",
      },
      {
        title: "Scale contracts",
        body: "Used for larger delivery volumes, multi-point operations and expanded service needs.",
      },
      {
        title: "Enterprise terms",
        body: "Used for compliance-heavy deployments, custom workflows and negotiated service layers.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions answered with operational clarity.",
    description:
      "The FAQ stays short and practical, focused on active service use, coverage constraints and operations clarity.",
    summary:
      "The goal is to answer real user questions quickly, without turning the product entry point into a documentation wall.",
    pillars: [
      {
        title: "Deployment questions",
        body: "Covers onboarding flow, account setup and how new service areas would be introduced later.",
      },
      {
        title: "Service model questions",
        body: "Covers delivery constraints, active coverage limits and role separation across the platform.",
      },
      {
        title: "Operational trust questions",
        body: "Covers escalation handling, monitoring, compliance and service reliability.",
      },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "A direct path to the SkySend team.",
    description:
      "Contact remains available for operational support, billing questions and coverage clarification around the live service area.",
    summary:
      "This page supports a live product experience first, with contact as a support path rather than the primary conversion flow.",
    pillars: [
      {
        title: "Commercial contact",
        body: "Used for pricing questions, account setup and support around the active service area.",
      },
      {
        title: "Operator inquiries",
        body: "Used for technical coordination, city readiness and operational fit checks.",
      },
      {
        title: "Support routing",
        body: "Used for account help, escalation paths and service support.",
      },
    ],
  },
} satisfies Record<string, PublicPageContent>;
