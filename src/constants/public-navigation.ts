export type PublicNavItem = {
  label: string;
  href:
    | "/"
    | "/how-it-works"
    | "/coverage"
    | "/pricing"
    | "/faq"
    | "/contact";
};

export const publicNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Coverage", href: "/coverage" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
