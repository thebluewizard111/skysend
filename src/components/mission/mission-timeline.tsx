"use client";

import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { missionStatusLabels } from "@/constants/mission";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import type { MissionStatus } from "@/types/mission";

type TimelineStepState = "completed" | "current" | "upcoming";

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  statuses: MissionStatus[];
};

const timelineSteps: TimelineStep[] = [
  {
    key: "mission_created",
    label: "Mission created",
    description: "The confirmed order is attached to a live SkySend mission.",
    statuses: ["mission_created"],
  },
  {
    key: "preflight",
    label: "Pre-flight checks",
    description: "Drone, locker and route readiness are checked before dispatch.",
    statuses: ["preflight_checks"],
  },
  {
    key: "dispatch",
    label: "Drone dispatched",
    description: "The drone leaves SkySend Pitesti Hub toward pickup.",
    statuses: ["drone_dispatched", "en_route_to_pickup"],
  },
  {
    key: "pickup_handoff",
    label: "Pickup handoff",
    description: "Sender position, PIN, locker descent and parcel loading.",
    statuses: [
      "arrived_at_pickup",
      "awaiting_sender_position_confirmation",
      "awaiting_pickup_pin",
      "pickup_safety_check",
      "locker_descending_pickup",
      "awaiting_parcel_load",
      "locker_ascending_pickup",
      "payload_verification",
    ],
  },
  {
    key: "parcel_secured",
    label: "Parcel secured",
    description: "Payload verification is complete and the parcel is secured.",
    statuses: ["parcel_secured"],
  },
  {
    key: "in_transit",
    label: "In transit",
    description: "The drone is flying toward the recipient drop-off point.",
    statuses: ["en_route_to_dropoff"],
  },
  {
    key: "dropoff_handoff",
    label: "Drop-off handoff",
    description: "Recipient position, PIN, locker descent and parcel collection.",
    statuses: [
      "arrived_at_dropoff",
      "awaiting_recipient_position_confirmation",
      "awaiting_recipient_pin",
      "dropoff_safety_check",
      "locker_descending_dropoff",
      "awaiting_parcel_collection",
      "locker_ascending_dropoff",
    ],
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Delivery completion, proof generation and mission closeout.",
    statuses: ["delivery_completed", "proof_generated", "mission_closed"],
  },
];

function getCurrentStepIndex(status: MissionStatus | null) {
  if (!status) {
    return -1;
  }

  const index = timelineSteps.findIndex((step) =>
    step.statuses.includes(status),
  );

  if (index >= 0) {
    return index;
  }

  return timelineSteps.length - 1;
}

function getStepState(index: number, currentIndex: number): TimelineStepState {
  if (currentIndex < 0) {
    return "upcoming";
  }

  if (index < currentIndex) {
    return "completed";
  }

  if (index === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function getStepIcon(state: TimelineStepState) {
  if (state === "completed") {
    return <CheckCircle2 className="size-4" />;
  }

  if (state === "current") {
    return <Clock3 className="size-4" />;
  }

  return <Circle className="size-4" />;
}

function getStepTone(state: TimelineStepState) {
  if (state === "completed") {
    return "success" as const;
  }

  if (state === "current") {
    return "info" as const;
  }

  return "neutral" as const;
}

export function MissionTimeline() {
  const { currentStatus } = useMissionRuntime();
  const currentIndex = getCurrentStepIndex(currentStatus);

  return (
    <SectionCard
      eyebrow="Timeline"
      title="Mission timeline"
      description="The mission advances through the main operational phases from creation to proof."
    >
      <div className="grid gap-3">
        {timelineSteps.map((step, index) => {
          const state = getStepState(index, currentIndex);
          const isCurrent = state === "current";

          return (
            <div
              key={step.key}
              className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground">
                {getStepIcon(state)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {index + 1}. {step.label}
                  </p>
                  <StatusBadge
                    label={
                      state === "completed"
                        ? "Completed"
                        : state === "current"
                          ? "Current"
                          : "Upcoming"
                    }
                    tone={getStepTone(state)}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isCurrent && currentStatus
                    ? missionStatusLabels[currentStatus]
                    : step.description}
                </p>
              </div>
              <div className="text-sm text-muted-foreground sm:justify-self-end">
                {isCurrent ? "Live now" : state === "completed" ? "Done" : "Queued"}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

