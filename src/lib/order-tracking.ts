import type { CreateDeliverySubmitStatus } from "@/types/create-delivery";
import type { OrderStatus } from "@/types/domain";

export type TrackingStepState = "done" | "current" | "upcoming" | "failed";

export type TrackingStep = {
  key: string;
  label: string;
  description: string;
  date: string | null;
  state: TrackingStepState;
};

const trackingStepLabels = [
  {
    key: "received",
    label: "Order received",
    description: "SkySend recorded the delivery request and route payload.",
  },
  {
    key: "reviewing",
    label: "Reviewing",
    description: "Coverage, handoff points and parcel constraints are being checked.",
  },
  {
    key: "drone_assigned",
    label: "Drone assigned",
    description: "The delivery has a recommended drone class for dispatch.",
  },
  {
    key: "pickup_pending",
    label: "Pickup pending",
    description: "The mission is waiting for pickup handoff confirmation.",
  },
  {
    key: "in_transit",
    label: "In transit",
    description: "The parcel is moving toward the selected drop-off point.",
  },
  {
    key: "awaiting_recipient",
    label: "Awaiting recipient",
    description: "The drone is at the destination and waiting for final handoff.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "The delivery is complete and ready for proof-of-delivery review.",
  },
  {
    key: "failed_fallback",
    label: "Failed / fallback",
    description: "The delivery needs exception handling or a fallback route.",
  },
] as const;

const orderStatusCurrentStep: Record<OrderStatus, string> = {
  draft: "received",
  scheduled: "drone_assigned",
  queued: "pickup_pending",
  in_flight: "in_transit",
  delivered: "delivered",
  failed: "failed_fallback",
  cancelled: "failed_fallback",
  returned: "failed_fallback",
};

const createdOrderStatusCurrentStep: Record<CreateDeliverySubmitStatus, string> = {
  pending_review: "reviewing",
  scheduled: "drone_assigned",
};

function addMinutes(value: string, minutes: number) {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

function buildTrackingSteps({
  currentStepKey,
  createdAt,
  scheduledFor,
  completedAt,
  isFailure,
}: {
  currentStepKey: string;
  createdAt: string;
  scheduledFor?: string | null;
  completedAt?: string | null;
  isFailure?: boolean;
}): TrackingStep[] {
  const activeIndex = trackingStepLabels.findIndex(
    (step) => step.key === currentStepKey,
  );
  const effectiveActiveIndex = Math.max(0, activeIndex);

  return trackingStepLabels.map((step, index) => {
    const isTerminalFailure = step.key === "failed_fallback" && isFailure;
    const isTerminalSuccess = step.key === "delivered" && currentStepKey === "delivered";
    const isCurrent = index === effectiveActiveIndex;
    const isDone =
      index < effectiveActiveIndex ||
      isTerminalSuccess ||
      (isTerminalFailure && currentStepKey === "failed_fallback");

    return {
      ...step,
      date:
        step.key === "received"
          ? createdAt
          : step.key === "reviewing" && index <= effectiveActiveIndex
            ? addMinutes(createdAt, 2)
            : step.key === "drone_assigned" && index <= effectiveActiveIndex
              ? scheduledFor ?? addMinutes(createdAt, 6)
              : step.key === "pickup_pending" && index <= effectiveActiveIndex
                ? scheduledFor ?? addMinutes(createdAt, 10)
                : step.key === "in_transit" && index <= effectiveActiveIndex
                  ? scheduledFor ? addMinutes(scheduledFor, 8) : addMinutes(createdAt, 18)
                  : (step.key === "delivered" || step.key === "failed_fallback") &&
                      (isTerminalSuccess || isTerminalFailure)
                    ? completedAt ?? addMinutes(createdAt, 28)
                    : null,
      state: isTerminalFailure
        ? "failed"
        : isDone
          ? "done"
          : isCurrent
            ? "current"
            : "upcoming",
    };
  });
}

export function getTrackingStepsForOrder({
  status,
  createdAt,
  scheduledFor,
  completedAt,
}: {
  status: OrderStatus;
  createdAt: string;
  scheduledFor?: string | null;
  completedAt?: string | null;
}) {
  return buildTrackingSteps({
    currentStepKey: orderStatusCurrentStep[status],
    createdAt,
    scheduledFor,
    completedAt,
    isFailure:
      status === "failed" ||
      status === "cancelled" ||
      status === "returned",
  });
}

export function getTrackingStepsForCreatedOrder({
  status,
  createdAt,
}: {
  status: CreateDeliverySubmitStatus;
  createdAt: string;
}) {
  return buildTrackingSteps({
    currentStepKey: createdOrderStatusCurrentStep[status],
    createdAt,
    scheduledFor: addMinutes(createdAt, 8),
  });
}
