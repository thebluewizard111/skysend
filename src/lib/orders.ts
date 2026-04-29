import {
  deliveryUrgencyLabels,
  orderStatusLabels,
} from "@/constants/domain";
import type { OrderStatus, DeliveryUrgency } from "@/types/domain";
import type { DeliveryOrder } from "@/types/entities";
import type {
  OrderDateField,
  OrderProgressSnapshot,
  OrderSortDirection,
  OrdersByStatus,
  OrderTimelineItem,
} from "@/types/order-helpers";

const orderProgressMap: Record<OrderStatus, OrderProgressSnapshot> = {
  draft: {
    value: 8,
    label: "Order draft captured",
  },
  scheduled: {
    value: 24,
    label: "Delivery window reserved",
  },
  queued: {
    value: 42,
    label: "Queued for dispatch",
  },
  in_flight: {
    value: 76,
    label: "Drone mission in progress",
  },
  delivered: {
    value: 100,
    label: "Delivered successfully",
  },
  failed: {
    value: 100,
    label: "Mission ended with failure",
  },
  cancelled: {
    value: 100,
    label: "Order cancelled",
  },
  returned: {
    value: 100,
    label: "Parcel returned",
  },
};

const orderStatusGroupOrder: readonly OrderStatus[] = [
  "draft",
  "scheduled",
  "queued",
  "in_flight",
  "delivered",
  "failed",
  "cancelled",
  "returned",
] as const;

function getComparableDateValue(value?: string | null) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function getOrderDateValue(order: DeliveryOrder, field: OrderDateField) {
  return getComparableDateValue(order[field] ?? null);
}

export function formatOrderStatus(status: OrderStatus) {
  return orderStatusLabels[status];
}

export function getOrderProgress(order: Pick<DeliveryOrder, "status">) {
  return orderProgressMap[order.status];
}

export function groupOrdersByStatus(
  orders: readonly DeliveryOrder[],
): OrdersByStatus {
  const grouped = orderStatusGroupOrder.reduce<OrdersByStatus>(
    (result, status) => {
      result[status] = [];
      return result;
    },
    {
      draft: [],
      scheduled: [],
      queued: [],
      in_flight: [],
      delivered: [],
      failed: [],
      cancelled: [],
      returned: [],
    },
  );

  for (const order of orders) {
    grouped[order.status].push(order);
  }

  return grouped;
}

export function sortOrdersByDate(
  orders: readonly DeliveryOrder[],
  field: OrderDateField = "createdAt",
  direction: OrderSortDirection = "desc",
) {
  return [...orders].sort((left, right) => {
    const leftValue = getOrderDateValue(left, field);
    const rightValue = getOrderDateValue(right, field);

    return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
  });
}

export function formatDeliveryUrgency(urgency: DeliveryUrgency) {
  return deliveryUrgencyLabels[urgency];
}

export function getOrderTimelineLabels(
  order: Pick<
    DeliveryOrder,
    "createdAt" | "scheduledFor" | "completedAt" | "status"
  >,
): OrderTimelineItem[] {
  const isResolved =
    order.status === "delivered" ||
    order.status === "failed" ||
    order.status === "cancelled" ||
    order.status === "returned";

  const hasStarted =
    order.status === "queued" ||
    order.status === "in_flight" ||
    isResolved;

  const completionLabel =
    order.status === "failed"
      ? "Failed"
      : order.status === "cancelled"
        ? "Cancelled"
        : order.status === "returned"
          ? "Returned"
          : "Delivered";

  return [
    {
      key: "created",
      label: "Order created",
      date: order.createdAt,
      status: "done",
    },
    {
      key: "scheduled",
      label: "Dispatch window",
      date: order.scheduledFor ?? null,
      status:
        order.status === "draft"
          ? "upcoming"
          : order.status === "scheduled"
            ? "current"
            : "done",
    },
    {
      key: "dispatch",
      label: "Dispatch started",
      date: hasStarted ? order.scheduledFor ?? null : null,
      status:
        order.status === "queued" || order.status === "in_flight"
          ? "current"
          : hasStarted
            ? "done"
            : "upcoming",
    },
    {
      key: "completion",
      label: completionLabel,
      date: order.completedAt ?? null,
      status: isResolved ? "done" : "upcoming",
    },
  ];
}
