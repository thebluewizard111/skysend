import { NextResponse } from "next/server";
import {
  createStripePaymentIntentParams,
  getStripeServer,
} from "@/lib/stripe/server";
import type { StripePaymentIntentDraft } from "@/types/stripe";

type PaymentIntentRequestBody = {
  orderId?: string;
  amountMinor?: number;
  currency?: "RON";
  customerProfileId?: string | null;
  description?: string;
};

export async function POST(request: Request) {
  let body: PaymentIntentRequestBody;

  try {
    body = (await request.json()) as PaymentIntentRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 400 },
    );
  }

  if (!body.orderId || !body.amountMinor || body.amountMinor < 100) {
    return NextResponse.json(
      { error: "Order amount is not valid for checkout." },
      { status: 400 },
    );
  }

  const draft: StripePaymentIntentDraft = {
    amountMinor: body.amountMinor,
    currency: body.currency ?? "RON",
    customerProfileId: body.customerProfileId ?? "local-client",
    orderId: body.orderId,
    metadata: {
      orderId: body.orderId,
      product: "skysend_delivery",
      environment: "test",
    },
    statementDescriptorSuffix: "SKYSEND",
  };
  let paymentIntent;

  try {
    const stripe = getStripeServer();
    paymentIntent = await stripe.paymentIntents.create({
      ...createStripePaymentIntentParams(draft),
      description: body.description ?? `SkySend delivery ${body.orderId}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Stripe payment could not be prepared. Please retry." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
  });
}
