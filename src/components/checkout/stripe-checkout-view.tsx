"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPinned,
  MoveRight,
  Package2,
  ReceiptText,
  Route,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { droneClassLabels } from "@/constants/domain";
import { activeHub } from "@/constants/hub";
import { calculateDistanceKm } from "@/lib/mission-route";
import { calculateMissionPricing } from "@/lib/pricing";
import {
  readCreatedDeliveryOrder,
  updateCreatedDeliveryOrderPayment,
} from "@/lib/create-delivery-submit";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { DeliveryUrgency } from "@/types/domain";

type StripeCheckoutViewProps = {
  orderId: string;
};

type CheckoutState =
  | { status: "idle"; message: string | null }
  | { status: "loading"; message: string | null }
  | { status: "failed"; message: string };

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function toPricingUrgency(
  urgency: CreatedDeliveryOrder["payload"]["urgency"],
): DeliveryUrgency {
  return urgency === "scheduled" ? "standard" : urgency;
}

function parseWeightRangeMidpoint(range: string) {
  const values = range
    .replace(",", ".")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => Number.isFinite(value));

  if (!values?.length) {
    return null;
  }

  const min = values[0];
  const max = values[1] ?? values[0];

  return Math.round(((min + max) / 2) * 10) / 10;
}

function getCheckoutPricing(order: CreatedDeliveryOrder) {
  const hubToPickupKm = calculateDistanceKm(
    activeHub.address.location,
    order.payload.selectedPickupPoint.location,
  );
  const pickupToDropoffKm = calculateDistanceKm(
    order.payload.selectedPickupPoint.location,
    order.payload.selectedDropoffPoint.location,
  );
  const routeDistanceKm = hubToPickupKm + pickupToDropoffKm;
  const pricing = calculateMissionPricing({
    distanceKm: routeDistanceKm,
    urgency: toPricingUrgency(order.payload.urgency),
    droneClass: order.payload.recommendedDroneClass,
    parcel: {
      estimatedWeightKg: parseWeightRangeMidpoint(
        order.payload.parcel.estimatedWeightRange,
      ),
    },
  });

  return pricing;
}

function ExpiredCheckoutState({ orderId }: { orderId: string }) {
  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Checkout"
        title="Checkout session unavailable"
        description="This local order is no longer available in the browser session."
        actions={[
          {
            label: "Back to create delivery",
            href: "/client/create-delivery",
            variant: "default",
            icon: <ArrowLeft className="size-4" />,
          },
        ]}
      />
      <SectionCard
        eyebrow="Order"
        title={orderId}
        description="Create the delivery again to prepare a fresh checkout session."
      >
        <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5 text-sm leading-6 text-muted-foreground">
          SkySend could not find the order payload needed for checkout.
        </div>
      </SectionCard>
    </section>
  );
}

export function StripeCheckoutView({ orderId }: StripeCheckoutViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<CreatedDeliveryOrder | null>(null);
  const [hasLoadedOrder, setHasLoadedOrder] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    status: "idle",
    message: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const pricing = useMemo(() => (order ? getCheckoutPricing(order) : null), [order]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedOrder = readCreatedDeliveryOrder(orderId);

      setOrder(storedOrder);
      setHasLoadedOrder(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [orderId]);

  useEffect(() => {
    if (!order || searchParams.get("checkout") !== "success") {
      return;
    }

    let disposed = false;
    const sessionId = searchParams.get("session_id");
    const checkoutOrder = order;

    async function verifyCheckoutSession() {
      if (!sessionId) {
        setCheckoutState({
          status: "failed",
      message: "Secure checkout returned without a session id.",
        });
        return;
      }

      setCheckoutState({
        status: "loading",
        message: "Confirming Stripe payment.",
      });

      try {
        const response = await fetch(
          `/api/stripe/checkout-session?sessionId=${encodeURIComponent(sessionId)}`,
        );
        const result = (await response.json()) as {
          paymentStatus?: string;
          paymentIntentId?: string | null;
          error?: string;
        };

        if (!response.ok || result.paymentStatus !== "paid") {
          throw new Error(result.error ?? "Stripe payment was not confirmed.");
        }

        if (!disposed) {
          updateCreatedDeliveryOrderPayment({
            orderId: checkoutOrder.id,
            paymentStatus: "paid",
            stripePaymentIntentId: result.paymentIntentId ?? sessionId,
          });
          router.replace(`${checkoutOrder.href}?brief=1`);
        }
      } catch (error) {
        if (!disposed) {
          updateCreatedDeliveryOrderPayment({
            orderId: checkoutOrder.id,
            paymentStatus: "failed",
          });
          setCheckoutState({
            status: "failed",
            message:
              error instanceof Error
                ? error.message
                : "Stripe payment could not be verified.",
          });
        }
      }
    }

    void verifyCheckoutSession();

    return () => {
      disposed = true;
    };
  }, [order, router, searchParams]);

  if (!hasLoadedOrder) {
    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Checkout"
          title="Preparing checkout"
          description="Loading the order summary and secure payment session."
        />
      </section>
    );
  }

  if (!order || !pricing) {
    return <ExpiredCheckoutState orderId={orderId} />;
  }

  const handleSubmitPayment = async () => {
    if (!order || !pricing || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setPaymentMessage(null);
    setCheckoutState({
      status: "loading",
      message: "Opening secure checkout.",
    });

    try {
      updateCreatedDeliveryOrderPayment({
        orderId: order.id,
        paymentStatus: "processing",
      });
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          amountMinor: pricing.total.amountMinor,
          currency: pricing.total.currency,
          description: `SkySend delivery ${order.id}`,
        }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Secure checkout could not be opened.");
      }

      window.location.assign(result.url);
    } catch (error) {
      updateCreatedDeliveryOrderPayment({
        orderId: order.id,
        paymentStatus: "failed",
      });
      setCheckoutState({
        status: "failed",
        message:
          error instanceof Error
            ? error.message
          : "Secure checkout could not be opened.",
      });
      setIsSubmitting(false);
    }
  };

  const handleRetryCheckout = () => {
    setPaymentMessage(null);
    setCheckoutState({
      status: "idle",
      message: null,
    });
  };

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Checkout"
        title="Confirm payment before dispatch"
        description="Complete the secure card payment before SkySend starts the live mission."
        actions={[
          {
            label: "Back to order",
            href: order.href,
            variant: "ghost",
            icon: <ArrowLeft className="size-4" />,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.58fr)]">
        <div className="grid gap-5">
          <SectionCard
            eyebrow="Order"
            title={order.id}
            description="Compact order context for checkout."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <div className="flex items-center gap-3">
                  <MapPinned className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Pickup</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {order.payload.pickupAddress.formattedAddress}
                  <br />
                  {order.payload.selectedPickupPoint.label}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <div className="flex items-center gap-3">
                  <MoveRight className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Drop-off</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {order.payload.dropoffAddress.formattedAddress}
                  <br />
                  {order.payload.selectedDropoffPoint.label}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Package2 className="size-4" />
                  Drone class
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {droneClassLabels[order.payload.recommendedDroneClass]}
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Route className="size-4" />
                  Distance
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {pricing.distanceKm.toFixed(2)} km
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ReceiptText className="size-4" />
                  Total
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {formatCurrency(pricing.total.amountMinor, pricing.total.currency)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Pricing"
            title="Pricing breakdown"
            description="Calculated from distance, urgency, drone class and parcel profile."
          >
            <div className="grid gap-2">
              {pricing.breakdown.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border/80 bg-background px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.amount.amountMinor, item.amount.currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-foreground">Total amount</p>
                <p className="font-heading text-2xl tracking-tight text-foreground">
                  {formatCurrency(pricing.total.amountMinor, pricing.total.currency)}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <Card className="h-fit rounded-[calc(var(--radius)+0.75rem)] shadow-[var(--elevation-card)]">
          <CardContent className="grid gap-4 p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="Secure card payment" tone="info" />
              </div>
              <h2 className="mt-4 font-heading text-2xl tracking-tight text-foreground">
                Payment
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Card details are handled by Stripe. SkySend does not store card
                numbers.
              </p>
            </div>

            {checkoutState.status === "failed" ? (
              <div className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-destructive/30 bg-destructive/8 p-4 text-sm leading-6 text-destructive">
                <p>{checkoutState.message}</p>
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={handleRetryCheckout}
                >
                  Retry checkout
                </AppButton>
              </div>
            ) : null}

            <div className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">Secure card payment</p>
              <p>
                The next step opens the secure payment page for card entry and
                confirmation.
              </p>
              {checkoutState.status === "loading" ? (
                <div className="flex items-center gap-2 text-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {checkoutState.message}
                </div>
              ) : null}
            </div>

            {paymentMessage ? (
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground">
                {paymentMessage}
              </div>
            ) : null}

            <AppButton
              type="button"
              size="lg"
              onClick={handleSubmitPayment}
              disabled={isSubmitting || checkoutState.status === "loading"}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {isSubmitting ? "Opening secure checkout" : "Pay securely"}
            </AppButton>

            <div className="grid gap-2 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="size-4" />
                Card payment
              </div>
              <p>Enter the card details in the secure checkout to confirm payment.</p>
              <p>The mission starts only after payment is confirmed.</p>
            </div>

            <AppButton asChild variant="outline" className="w-full">
              <Link href={order.href}>Return to order details</Link>
            </AppButton>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
