import { droneClassLabels } from "@/constants/domain";
import { paymentStatusLabels } from "@/constants/domain";
import {
  getMockDroneClasses,
  getMockEcoStats,
  getMockOrderPoints,
  getMockOrders,
  getMockParcels,
  getMockPaymentMethods,
  getMockPaymentRecords,
} from "@/lib/mock-data";
import {
  formatOrderStatus,
  getOrderProgress,
  getOrderTimelineLabels,
} from "@/lib/orders";
import { formatEstimatedCo2Saved, formatRoadDistanceAvoided } from "@/lib/eco";
import type {
  ClientOrderPaymentSnapshot,
  ClientFailedOrderSummary,
  ClientOrderDetail,
  ClientOrderStatusFilter,
  ClientOrderSummary,
} from "@/types/client-orders";
import type { DeliveryOrder, OrderPoint, PaymentMethod, PaymentRecord } from "@/types/entities";

const ROAD_PREFIX_PATTERN =
  /^(strada|bulevardul|piata|piața|calea|bd\.|blvd\.|b-dul)\s+/i;

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function normalizePaymentStatus(
  status?: PaymentRecord["status"] | null,
): Extract<ClientOrderPaymentSnapshot["status"], "paid" | "pending" | "failed" | "refunded"> {
  switch (status) {
    case "paid":
    case "failed":
    case "refunded":
      return status;
    default:
      return "pending";
  }
}

function getPaymentSnapshot(
  payment?: PaymentRecord | null,
  method?: PaymentMethod | null,
): ClientOrderPaymentSnapshot {
  const status = normalizePaymentStatus(payment?.status);
  const methodLabel = method?.label ?? "Payment method pending";
  const methodDetail =
    method?.type === "card"
      ? `${method.brand ?? "Card"} ending in ${method.last4 ?? "0000"}`
      : method?.type === "invoice"
        ? "Monthly invoice settlement"
        : "No saved payment method";

  return {
    id: payment?.id ?? null,
    status,
    statusLabel: paymentStatusLabels[status],
    methodLabel,
    methodDetail,
    amountLabel: payment
      ? formatCurrency(payment.amount.amountMinor, payment.amount.currency)
      : "Cost pending",
    hasPaymentIssue: status === "failed" || status === "refunded",
  };
}

function getAreaLabel(point?: OrderPoint | null) {
  const rawLabel = point?.address.formattedAddress.split(",")[0]?.trim();

  if (!rawLabel) {
    return "Pitesti area";
  }

  return rawLabel
    .replace(ROAD_PREFIX_PATTERN, "")
    .replace(/\s+\d+[A-Za-z/-]*$/u, "")
    .trim();
}

export function getClientOrderStatusFilter(
  status: DeliveryOrder["status"],
): ClientOrderStatusFilter {
  switch (status) {
    case "queued":
    case "in_flight":
      return "active";
    case "delivered":
      return "completed";
    case "failed":
    case "returned":
      return "failed";
    case "scheduled":
      return "scheduled";
    case "cancelled":
      return "cancelled";
    default:
      return "all";
  }
}

export function getClientOrderSummaries() {
  const orders = getMockOrders();
  const orderPoints = getMockOrderPoints();
  const paymentRecords = getMockPaymentRecords();
  const paymentMethods = getMockPaymentMethods();

  const pointById = new Map(orderPoints.map((point) => [point.id, point]));
  const paymentByOrderId = new Map(
    paymentRecords.map((payment) => [payment.orderId, payment]),
  );
  const paymentMethodById = new Map(
    paymentMethods.map((method) => [method.id, method]),
  );

  const summaries: ClientOrderSummary[] = orders.map((order) => {
    const pickupPoint = pointById.get(order.pickupPointId);
    const dropoffPoint = pointById.get(order.dropoffPointId);
    const payment = paymentByOrderId.get(order.id);
    const paymentMethod = payment?.paymentMethodId
      ? paymentMethodById.get(payment.paymentMethodId)
      : null;
    const paymentSnapshot = getPaymentSnapshot(payment, paymentMethod);

    return {
      id: order.id,
      href: `/client/orders/${order.id}`,
      pickupArea: getAreaLabel(pickupPoint),
      dropoffArea: getAreaLabel(dropoffPoint),
      status: order.status,
      statusFilter: getClientOrderStatusFilter(order.status),
      urgency: order.urgency,
      createdAt: order.createdAt,
      scheduledFor: order.scheduledFor,
      estimatedCostLabel: paymentSnapshot.amountLabel,
      payment: paymentSnapshot,
    };
  });

  return summaries.sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

function getFallbackInfo(order: DeliveryOrder) {
  const reason = order.cancellationReason?.toLowerCase() ?? "";

  if (reason.includes("reroute") || reason.includes("fallback")) {
    return {
      fallbackUsed: true,
      fallbackLabel: "Fallback route attempted",
    };
  }

  if (reason.includes("weather") || reason.includes("wind")) {
    return {
      fallbackUsed: false,
      fallbackLabel: "No compliant fallback available",
    };
  }

  if (reason.includes("blocked") || reason.includes("obstruction")) {
    return {
      fallbackUsed: true,
      fallbackLabel: "Fallback check completed",
    };
  }

  return {
    fallbackUsed: false,
    fallbackLabel: "No fallback used",
  };
}

export function getClientFailedOrderSummaries() {
  const orders = getMockOrders().filter((order) => order.status === "failed");
  const summaries = getClientOrderSummaries();

  const failedSummaries: ClientFailedOrderSummary[] = orders
    .map((order) => {
      const summary = summaries.find((item) => item.id === order.id);

      if (!summary || !order.cancellationReason) {
        return null;
      }

      const fallback = getFallbackInfo(order);

      return {
        ...summary,
        failureReason: order.cancellationReason,
        fallbackUsed: fallback.fallbackUsed,
        fallbackLabel: fallback.fallbackLabel,
        paymentIssueLabel: summary.payment.hasPaymentIssue
          ? `${summary.payment.statusLabel}: ${summary.payment.methodDetail}`
          : null,
      };
    })
    .filter((item): item is ClientFailedOrderSummary => item !== null);

  return failedSummaries.sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function getClientOrderDetail(orderId: string): ClientOrderDetail | null {
  const orders = getMockOrders();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return null;
  }

  const orderPoints = getMockOrderPoints();
  const paymentRecords = getMockPaymentRecords();
  const paymentMethods = getMockPaymentMethods();
  const parcels = getMockParcels();
  const ecoStats = getMockEcoStats();
  const droneClasses = getMockDroneClasses();

  const pointById = new Map(orderPoints.map((point) => [point.id, point]));
  const paymentByOrderId = new Map(
    paymentRecords.map((payment) => [payment.orderId, payment]),
  );
  const paymentMethodById = new Map(
    paymentMethods.map((method) => [method.id, method]),
  );
  const parcelById = new Map(parcels.map((parcel) => [parcel.id, parcel]));
  const ecoByOrderId = new Map(ecoStats.map((metric) => [metric.orderId, metric]));
  const droneById = new Map(droneClasses.map((drone) => [drone.id, drone]));

  const summary = getClientOrderSummaries().find((item) => item.id === orderId);
  const pickupPoint = pointById.get(order.pickupPointId);
  const dropoffPoint = pointById.get(order.dropoffPointId);
  const payment = paymentByOrderId.get(order.id);
  const paymentMethod = payment?.paymentMethodId
    ? paymentMethodById.get(payment.paymentMethodId)
    : null;
  const paymentSnapshot = getPaymentSnapshot(payment, paymentMethod);
  const parcel = parcelById.get(order.parcelId);
  const eco = ecoByOrderId.get(order.id);
  const drone = order.assignedDroneClassId
    ? droneById.get(order.assignedDroneClassId)
    : null;
  const progress = getOrderProgress(order);

  if (!summary || !pickupPoint || !dropoffPoint) {
    return null;
  }

  return {
    ...summary,
    cancellationReason: order.cancellationReason,
    completedAt: order.completedAt,
    progressValue: progress.value,
    progressLabel: progress.label,
    paymentStatusLabel: paymentSnapshot.statusLabel,
    paymentId: paymentSnapshot.id,
    paymentMethodLabel: paymentSnapshot.methodLabel,
    paymentMethodDetail: paymentSnapshot.methodDetail,
    pickupAddress: pickupPoint.address.formattedAddress,
    dropoffAddress: dropoffPoint.address.formattedAddress,
    pickupPointNote: pickupPoint.notes ?? null,
    dropoffPointNote: dropoffPoint.notes ?? null,
    parcelSummary: parcel?.contentsSummary ?? null,
    recommendedDroneClass: drone
      ? {
          id: drone.id,
          name: drone.config.name ?? droneClassLabels[drone.id],
          shortDescription: drone.config.shortDescription,
        }
      : null,
    ecoEstimate: eco
      ? {
          co2SavedLabel: formatEstimatedCo2Saved(eco.estimatedCo2SavedGrams),
          roadDistanceLabel: formatRoadDistanceAvoided(
            eco.estimatedRoadDistanceSavedKm,
          ),
          methodologyNote: eco.methodologyNote,
        }
      : null,
    proofSummary:
      order.status === "delivered"
        ? `Delivery was completed successfully on ${order.completedAt ?? order.updatedAt}, with the recipient handoff recorded inside the active Pitesti service area.`
        : null,
    failureSummary:
      order.status === "failed"
        ? order.cancellationReason ??
          "The mission ended before handoff and requires review."
        : order.status === "cancelled"
          ? order.cancellationReason ??
            "The order was cancelled before the mission could complete."
          : null,
    fallbackSummary: getFallbackInfo(order).fallbackLabel,
    pickupCoordinates: pickupPoint.address.location,
    dropoffCoordinates: dropoffPoint.address.location,
    timeline: getOrderTimelineLabels(order).map((item) => ({
      key: item.key,
      label:
        item.key === "completion" && item.date
          ? formatOrderStatus(order.status)
          : item.label,
      date: item.date,
      status: item.status,
    })),
  };
}
