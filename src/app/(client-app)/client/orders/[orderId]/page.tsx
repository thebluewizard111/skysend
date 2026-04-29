import { notFound } from "next/navigation";
import { CreatedDeliveryOrderDetails } from "@/components/delivery/created-delivery-order-details";
import { LiveMissionTrackingView } from "@/components/delivery/live-mission-tracking-view";
import { droneClassLabels } from "@/constants/domain";
import { createPageMetadata } from "@/lib/metadata";
import { getClientOrderDetail } from "@/lib/client-orders";
import {
  formatDeliveryUrgency,
  formatOrderStatus,
} from "@/lib/orders";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { CreatedDeliveryPaymentStatus } from "@/types/create-delivery";
import type { DeliveryUrgency, DroneClass } from "@/types/domain";
import type { ClientOrderDetail } from "@/types/client-orders";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

const fallbackEta = {
  minMinutes: 2,
  maxMinutes: 4,
};

function isLocalCreatedOrderId(orderId: string) {
  return orderId.startsWith("SKY-PT-");
}

function isDroneClass(value?: string | null): value is DroneClass {
  return Boolean(value && value in droneClassLabels);
}

function toRuntimeOrder(order: ClientOrderDetail): CreatedDeliveryOrder {
  const droneClass = isDroneClass(order.recommendedDroneClass?.id)
    ? order.recommendedDroneClass.id
    : "standard_courier";

  return {
    id: order.id,
    status: "scheduled",
    href: order.href,
    payload: {
      userId: null,
      pickupAddress: {
        input: order.pickupAddress,
        formattedAddress: order.pickupAddress,
        notes: order.pickupPointNote ?? null,
        location: order.pickupCoordinates,
        city: "Pitesti",
        county: "Arges",
        country: "Romania",
        postalCode: null,
      },
      dropoffAddress: {
        input: order.dropoffAddress,
        formattedAddress: order.dropoffAddress,
        notes: order.dropoffPointNote ?? null,
        location: order.dropoffCoordinates,
        city: "Pitesti",
        county: "Arges",
        country: "Romania",
        postalCode: null,
      },
      selectedPickupPoint: {
        id: `${order.id}:pickup`,
        label: order.pickupArea,
        type: "public_point",
        description: order.pickupPointNote ?? order.pickupAddress,
        location: order.pickupCoordinates,
        eligibilityState: "eligible",
        recommendationState: "recommended",
        smartScore: 92,
        distanceFromOriginMeters: 35,
      },
      selectedDropoffPoint: {
        id: `${order.id}:dropoff`,
        label: order.dropoffArea,
        type: "public_point",
        description: order.dropoffPointNote ?? order.dropoffAddress,
        location: order.dropoffCoordinates,
        eligibilityState: "eligible",
        recommendationState: "recommended",
        smartScore: 91,
        distanceFromOriginMeters: 40,
      },
      parcel: {
        category: "retail",
        packaging: "boxed",
        approximateSize: "medium",
        contentDescription: order.parcelSummary ?? "SkySend parcel",
        estimatedWeightRange: "1-3 kg",
      },
      urgency: order.urgency,
      recommendedDroneClass: droneClass,
      estimatedPrice: {
        amountMinor: 0,
        currency: "RON",
      },
      estimatedEcoMetrics: {
        estimatedCo2SavedGrams: 0,
        estimatedRoadDistanceSavedKm: 0,
        estimatedEnergyUseKwh: 0,
      },
      estimatedEta: fallbackEta,
      coverageStatus: "inside",
      coverageSummary: {
        state: "inside",
        title: "Inside active Pitesti coverage",
        description: "Pickup and drop-off are inside the active SkySend zone.",
        tone: "success",
      },
      createdAt: order.createdAt,
    },
  };
}

function shouldStartMission(status: ClientOrderDetail["status"]) {
  return status === "scheduled" || status === "queued" || status === "in_flight";
}

function toTrackingPaymentStatus(
  status: ClientOrderDetail["payment"]["status"],
): CreatedDeliveryPaymentStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "unpaid";
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { orderId } = await params;
  const order = getClientOrderDetail(orderId);

  if (!order) {
    if (isLocalCreatedOrderId(orderId)) {
      return createPageMetadata(
        `Order ${orderId}`,
        "Review the SkySend order created through the initial session submit flow.",
      );
    }

    return createPageMetadata(
      "Order Not Found",
      "The requested SkySend client order could not be found.",
    );
  }

  return createPageMetadata(
    `Order ${order.id}`,
    `Track the live SkySend mission for order ${order.id} in Pitesti.`,
  );
}

export default async function ClientOrderDetailsPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = getClientOrderDetail(orderId);

  if (!order) {
    if (isLocalCreatedOrderId(orderId)) {
      return <CreatedDeliveryOrderDetails orderId={orderId} />;
    }

    notFound();
  }

  const runtimeOrder = toRuntimeOrder(order);
  const etaLabel = `${runtimeOrder.payload.estimatedEta.minMinutes} to ${runtimeOrder.payload.estimatedEta.maxMinutes} min`;
  const paymentStatus = toTrackingPaymentStatus(order.payment.status);

  return (
    <LiveMissionTrackingView
      order={runtimeOrder}
      statusLabel={formatOrderStatus(order.status)}
      urgencyLabel={formatDeliveryUrgency(order.urgency as DeliveryUrgency)}
      priceLabel={order.estimatedCostLabel}
      etaLabel={etaLabel}
      paymentLabel={`${order.paymentStatusLabel ?? "Pending"} / ${
        order.paymentMethodDetail ?? "Payment method pending"
      }`}
      paymentStatus={paymentStatus}
      checkoutHref={`/client/checkout/${order.id}`}
      parcelSummary={order.parcelSummary ?? "Parcel summary not available."}
      droneSummary={
        order.recommendedDroneClass
          ? `${order.recommendedDroneClass.name}: ${order.recommendedDroneClass.shortDescription}`
          : "Drone class will be assigned before dispatch."
      }
      outcomeSummary={
        order.proofSummary ??
        order.failureSummary ??
        "Proof of delivery will be prepared after recipient collection and mission closeout."
      }
      startOnMount={shouldStartMission(order.status) && paymentStatus === "paid"}
    />
  );
}
