import {
  deliveryUrgencyLabels,
  droneClassLabels,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/constants/domain";
import {
  getMockOrderPoints,
  getMockOrders,
  getMockPaymentRecords,
  getMockProfiles,
} from "@/lib/mock-data";
import type {
  AdminOrderManagementRow,
  AdminOrderReviewStatus,
} from "@/types/admin-orders";
import type { DeliveryOrder, PaymentRecord } from "@/types/entities";

function getReviewStatus(
  order: DeliveryOrder,
  payment?: PaymentRecord,
): AdminOrderReviewStatus {
  if (
    order.status === "failed" ||
    order.status === "cancelled" ||
    payment?.status === "failed" ||
    payment?.status === "refunded" ||
    (order.urgency === "critical" && order.status !== "delivered")
  ) {
    return "needs_review";
  }

  return "clear";
}

function getReviewReason(order: DeliveryOrder, payment?: PaymentRecord) {
  if (order.status === "failed") {
    return order.cancellationReason ?? "Delivery failed and needs admin review.";
  }

  if (order.status === "cancelled") {
    return order.cancellationReason ?? "Order was cancelled and should be checked.";
  }

  if (payment?.status === "failed") {
    return payment.failureReason ?? "Payment failed before the order closed.";
  }

  if (payment?.status === "refunded") {
    return "Payment was refunded and should be reconciled with the delivery outcome.";
  }

  if (order.urgency === "critical" && order.status !== "delivered") {
    return "Critical delivery still requires operational visibility.";
  }

  return "No active review issue in the admin queue.";
}

export function getAdminOrderManagementRows(): AdminOrderManagementRow[] {
  const orders = getMockOrders();
  const profiles = getMockProfiles();
  const points = getMockOrderPoints();
  const payments = getMockPaymentRecords();

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const pointById = new Map(points.map((point) => [point.id, point]));
  const paymentByOrderId = new Map(
    payments.map((payment) => [payment.orderId, payment]),
  );

  return orders
    .map((order) => {
      const client = profileById.get(order.customerProfileId);
      const pickup = pointById.get(order.pickupPointId);
      const dropoff = pointById.get(order.dropoffPointId);
      const payment = paymentByOrderId.get(order.id);
      const reviewStatus = getReviewStatus(order, payment);

      return {
        id: order.id,
        clientName: client?.fullName ?? "Unknown client",
        clientCompany: client?.companyName ?? null,
        pickupSummary:
          pickup?.address.formattedAddress ?? "Pickup location unavailable",
        dropoffSummary:
          dropoff?.address.formattedAddress ?? "Drop-off location unavailable",
        status: order.status,
        urgency: order.urgency,
        paymentStatus: payment?.status ?? "missing",
        paymentStatusLabel: payment
          ? paymentStatusLabels[payment.status]
          : "Payment missing",
        assignedDroneClass: order.assignedDroneClassId ?? null,
        assignedDroneClassLabel: order.assignedDroneClassId
          ? droneClassLabels[order.assignedDroneClassId]
          : "Pending assignment",
        createdAt: order.createdAt,
        scheduledFor: order.scheduledFor ?? null,
        reviewStatus,
        reviewReason:
          reviewStatus === "clear"
            ? `${orderStatusLabels[order.status]} / ${deliveryUrgencyLabels[order.urgency]} order is not flagged for manual review.`
            : getReviewReason(order, payment),
      } satisfies AdminOrderManagementRow;
    })
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}
