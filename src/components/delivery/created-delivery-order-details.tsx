"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LiveMissionTrackingView } from "@/components/delivery/live-mission-tracking-view";
import { PageHeader } from "@/components/shared/page-header";
import { droneClassLabels, deliveryUrgencyLabels } from "@/constants/domain";
import { parcelCategoryLabels, parcelPackagingLabels, parcelSizeLabels } from "@/lib/create-delivery-parcel";
import { readCreatedDeliveryOrder } from "@/lib/create-delivery-submit";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { DeliveryUrgency } from "@/types/domain";

type CreatedDeliveryOrderDetailsProps = {
  orderId: string;
};

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function getCreatedOrderStatusLabel(order: CreatedDeliveryOrder) {
  return order.status === "pending_review" ? "Pending review" : "Scheduled";
}

function getUrgencyLabel(value: CreatedDeliveryOrder["payload"]["urgency"]) {
  if (value === "scheduled") {
    return "Scheduled";
  }

  return deliveryUrgencyLabels[value as DeliveryUrgency];
}

export function CreatedDeliveryOrderDetails({
  orderId,
}: CreatedDeliveryOrderDetailsProps) {
  const [createdOrder, setCreatedOrder] = useState<CreatedDeliveryOrder | null>(
    null,
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCreatedOrder(readCreatedDeliveryOrder(orderId));
      setHasLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [orderId]);

  if (!hasLoaded) {
    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Order Details"
          title={orderId}
          description="Loading the order prepared in this browser session."
        />
      </section>
    );
  }

  if (!createdOrder) {
    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Order Details"
          title="Order session expired"
          description="This order was prepared locally in the browser session and is no longer available."
          actions={[
            {
              label: "Create delivery",
              href: "/client/create-delivery",
              variant: "default",
              icon: <ArrowLeft className="size-4" />,
            },
          ]}
        />
      </section>
    );
  }

  const { payload } = createdOrder;
  const etaLabel = `${payload.estimatedEta.minMinutes} to ${payload.estimatedEta.maxMinutes} min`;
  const priceLabel = formatCurrency(
    payload.estimatedPrice.amountMinor,
    payload.estimatedPrice.currency,
  );
  const parcelSummary = `${parcelCategoryLabels[payload.parcel.category]} / ${
    parcelSizeLabels[payload.parcel.approximateSize]
  } / ${parcelPackagingLabels[payload.parcel.packaging]}. Estimated weight ${
    payload.parcel.estimatedWeightRange
  }. ${payload.parcel.contentDescription}`;
  const paymentStatus = createdOrder.paymentStatus ?? "unpaid";
  const isPaid = paymentStatus === "paid";
  const isCompletedMission = createdOrder.fulfillmentStatus === "completed_mission";
  const isMissionFinal =
    isCompletedMission ||
    createdOrder.fulfillmentStatus === "failed_mission" ||
    createdOrder.fulfillmentStatus === "fallback_required";

  return (
    <LiveMissionTrackingView
      order={createdOrder}
      statusLabel={getCreatedOrderStatusLabel(createdOrder)}
      urgencyLabel={getUrgencyLabel(payload.urgency)}
      priceLabel={priceLabel}
      etaLabel={etaLabel}
      paymentLabel={isPaid ? "Card payment confirmed" : "Payment required"}
      paymentStatus={paymentStatus}
      checkoutHref={`/client/checkout/${createdOrder.id}`}
      parcelSummary={parcelSummary}
      droneSummary={droneClassLabels[payload.recommendedDroneClass]}
      outcomeSummary={
        isCompletedMission
          ? "Proof of delivery is available from the completed mission record."
          : "Proof of delivery will be prepared after recipient collection and mission closeout."
      }
      startOnMount={createdOrder.status === "scheduled" && isPaid && !isMissionFinal}
    />
  );
}
