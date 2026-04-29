import {
  getMockOrderPoints,
  getMockOrders,
  getMockPaymentRecords,
  getMockProfiles,
} from "@/lib/mock-data";
import type {
  AdminManualReviewItem,
  ManualReviewIssueType,
  ManualReviewRiskLevel,
} from "@/types/admin-review";
import type { DeliveryOrder, PaymentRecord } from "@/types/entities";

const issueLabels: Record<ManualReviewIssueType, string> = {
  address_confidence: "Address outside confidence range",
  unclear_point: "Unclear pickup/drop-off point",
  parcel_mismatch: "Parcel mismatch",
  payment_issue: "Payment issue",
  weather_safety: "Weather/safety flag",
  no_candidate_point: "No eligible candidate point",
};

function compactAddress(value?: string) {
  return value?.split(",")[0]?.trim() || "Pitesti location";
}

function getPaymentIssue(payment?: PaymentRecord) {
  if (!payment) {
    return null;
  }

  if (payment.status === "failed") {
    return {
      issueType: "payment_issue" as const,
      riskLevel: "high" as const,
      shortExplanation:
        payment.failureReason ??
        "Payment failed before the order could be closed cleanly.",
      recommendedAction:
        "Review the payment record and request a new payment method before dispatch.",
    };
  }

  if (payment.status === "refunded") {
    return {
      issueType: "payment_issue" as const,
      riskLevel: "medium" as const,
      shortExplanation:
        "Payment was refunded and should be reconciled with the delivery outcome.",
      recommendedAction:
        "Confirm whether the order should stay cancelled, be retried, or remain refunded.",
    };
  }

  return null;
}

function getOrderIssue(order: DeliveryOrder) {
  const reason = order.cancellationReason?.toLowerCase() ?? "";

  if (reason.includes("wind") || reason.includes("weather")) {
    return {
      issueType: "weather_safety" as const,
      riskLevel: "high" as const,
      shortExplanation:
        order.cancellationReason ??
        "Weather conditions triggered a safety review before dispatch.",
      recommendedAction:
        "Assign an operator to reassess safety limits and decide whether the order can be rescheduled.",
    };
  }

  if (reason.includes("blocked") || reason.includes("obstruction")) {
    return {
      issueType: "no_candidate_point" as const,
      riskLevel: "medium" as const,
      shortExplanation:
        order.cancellationReason ??
        "No eligible drop-off candidate point was available at arrival.",
      recommendedAction:
        "Request a new drop-off point or assign an operator to validate an alternate handoff.",
    };
  }

  if (reason.includes("payload") || reason.includes("exceeded")) {
    return {
      issueType: "parcel_mismatch" as const,
      riskLevel: "high" as const,
      shortExplanation:
        order.cancellationReason ??
        "Parcel details no longer match the selected drone capability.",
      recommendedAction:
        "Request updated parcel details or move the order to a heavier drone class after operator review.",
    };
  }

  if (order.status === "cancelled") {
    return {
      issueType: "address_confidence" as const,
      riskLevel: "low" as const,
      shortExplanation:
        order.cancellationReason ??
        "The delivery was cancelled after the service window changed.",
      recommendedAction:
        "Confirm whether the client wants a new delivery window or should keep the order cancelled.",
    };
  }

  if (order.urgency === "critical" && order.status !== "delivered") {
    return {
      issueType: "unclear_point" as const,
      riskLevel: "medium" as const,
      shortExplanation:
        "Critical delivery is not delivered yet and needs handoff point confidence before release.",
      recommendedAction:
        "Assign an operator to verify pickup and drop-off points before approving dispatch.",
    };
  }

  return null;
}

function getRiskRank(risk: ManualReviewRiskLevel) {
  switch (risk) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
  }
}

export function getAdminManualReviewItems(): AdminManualReviewItem[] {
  const orders = getMockOrders();
  const points = getMockOrderPoints();
  const payments = getMockPaymentRecords();
  const profiles = getMockProfiles();

  const pointById = new Map(points.map((point) => [point.id, point]));
  const paymentByOrderId = new Map(
    payments.map((payment) => [payment.orderId, payment]),
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return orders
    .flatMap((order) => {
      const payment = paymentByOrderId.get(order.id);
      const paymentIssue = getPaymentIssue(payment);
      const orderIssue = getOrderIssue(order);
      const issues = [orderIssue, paymentIssue].filter(
        (issue): issue is NonNullable<typeof issue> => issue !== null,
      );
      const pickup = pointById.get(order.pickupPointId);
      const dropoff = pointById.get(order.dropoffPointId);
      const client = profileById.get(order.customerProfileId);

      return issues.map((issue, index) => ({
        id: `review_${order.id}_${issue.issueType}_${index}`,
        orderId: order.id,
        issueType: issue.issueType,
        issueLabel: issueLabels[issue.issueType],
        shortExplanation: issue.shortExplanation,
        riskLevel: issue.riskLevel,
        recommendedAction: issue.recommendedAction,
        createdAt: order.updatedAt,
        clientLabel: client?.companyName ?? client?.fullName ?? "Unknown client",
        routeSummary: `${compactAddress(
          pickup?.address.formattedAddress,
        )} to ${compactAddress(dropoff?.address.formattedAddress)}`,
      }));
    })
    .sort((left, right) => {
      const riskDelta = getRiskRank(left.riskLevel) - getRiskRank(right.riskLevel);

      if (riskDelta !== 0) {
        return riskDelta;
      }

      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
}
