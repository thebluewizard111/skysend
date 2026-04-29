import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import {
  assertStripeTestSecretKey,
  buildStripePaymentIntentMetadata,
  toStripeCurrencyCode,
} from "@/lib/stripe/shared";
import type { StripePaymentIntentDraft } from "@/types/stripe";

let stripeServer: Stripe | null = null;

export function getStripeServer() {
  const secretKey = assertStripeTestSecretKey(serverEnv.STRIPE_SECRET_KEY);

  stripeServer ??= new Stripe(secretKey, {
    appInfo: {
      name: "SkySend",
      version: "0.1.0",
    },
  });

  return stripeServer;
}

export function createStripePaymentIntentParams(draft: StripePaymentIntentDraft) {
  return {
    amount: draft.amountMinor,
    currency: toStripeCurrencyCode(draft.currency),
    capture_method: draft.captureMethod ?? "automatic",
    customer: draft.stripeCustomerId ?? undefined,
    metadata: buildStripePaymentIntentMetadata(draft),
    setup_future_usage: draft.saveForFutureUse ? ("off_session" as const) : undefined,
    statement_descriptor_suffix: draft.statementDescriptorSuffix,
    automatic_payment_methods: {
      enabled: true,
    },
  } satisfies Stripe.PaymentIntentCreateParams;
}
