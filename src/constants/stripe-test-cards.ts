import type { StripeTestCard } from "@/types/stripe";

export const stripeTestCards: StripeTestCard[] = [
  {
    id: "visa-4242",
    label: "Visa card",
    brand: "Visa",
    last4: "4242",
    expiryLabel: "04/34",
    behaviorLabel: "Payment succeeds",
    description: "Generic success card for a standard saved-card UI preview.",
  },
  {
    id: "mastercard-4444",
    label: "Mastercard card",
    brand: "Mastercard",
    last4: "4444",
    expiryLabel: "06/35",
    behaviorLabel: "Payment succeeds",
    description: "Useful for showing multiple saved payment methods.",
  },
  {
    id: "insufficient-funds-9995",
    label: "Review required card",
    brand: "Visa",
    last4: "9995",
    expiryLabel: "08/34",
    behaviorLabel: "Payment fails",
    description: "Reserved for payment review and recovery flows.",
  },
  {
    id: "requires-authentication-3184",
    label: "Authentication required card",
    brand: "Visa",
    last4: "3184",
    expiryLabel: "10/35",
    behaviorLabel: "Requires authentication",
    description: "Prepared for later 3D Secure and authentication challenge states.",
  },
] as const;
