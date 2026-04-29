"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Crosshair,
  KeyRound,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import {
  missionStatusDescriptions,
  missionStatusLabels,
} from "@/constants/mission";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { maskMissionPin } from "@/lib/mission-pin";
import type { MissionStatus } from "@/types/mission";

type RecipientPanelMode =
  | "before_dropoff"
  | "confirm_position"
  | "verify_pin"
  | "confirm_collection"
  | "at_dropoff"
  | "completed"
  | "proof"
  | "closed"
  | "unavailable";

const dropoffArrivalStatuses: MissionStatus[] = [
  "arrived_at_dropoff",
  "dropoff_safety_check",
  "locker_descending_dropoff",
  "locker_ascending_dropoff",
];

function getPanelMode(status: MissionStatus | null): RecipientPanelMode {
  switch (status) {
    case "awaiting_recipient_position_confirmation":
      return "confirm_position";
    case "awaiting_recipient_pin":
      return "verify_pin";
    case "awaiting_parcel_collection":
      return "confirm_collection";
    case "delivery_completed":
      return "completed";
    case "proof_generated":
      return "proof";
    case "mission_closed":
      return "closed";
    default:
      if (status && dropoffArrivalStatuses.includes(status)) {
        return "at_dropoff";
      }

      return status ? "before_dropoff" : "unavailable";
  }
}

function getPanelCopy(mode: RecipientPanelMode, status: MissionStatus | null) {
  switch (mode) {
    case "confirm_position":
      return {
        title: "Confirm drone position",
        description:
          "Confirm the drone is above the approved drop-off point before PIN verification.",
        detail: "Confirm only if the drone is above the correct point.",
        badge: "Recipient action",
      };
    case "verify_pin":
      return {
        title: "Verify recipient PIN",
        description:
          "Enter the 4-digit recipient PIN to authorize locker descent for collection.",
        detail: "The locker opens only after PIN verification.",
        badge: "PIN required",
      };
    case "confirm_collection":
      return {
        title: "Parcel ready for collection",
        description:
          "Collect the parcel from the locker, then confirm the handoff is complete.",
        detail: "Confirm only after the parcel is fully removed from the locker.",
        badge: "Recipient action",
      };
    case "completed":
      return {
        title: "Parcel collected",
        description: "The recipient handoff has been recorded.",
        detail: "The mission is finalizing delivery records.",
        badge: "Collected",
      };
    case "proof":
      return {
        title: "Proof generated",
        description: "Proof of delivery has been generated from the handoff record.",
        detail: "PIN, locker and telemetry records are attached to the mission proof.",
        badge: "Proof ready",
      };
    case "closed":
      return {
        title: "Delivery closed",
        description: "The SkySend mission is complete.",
        detail: "No further recipient action is required.",
        badge: "Closed",
      };
    case "at_dropoff":
      return {
        title: status ? missionStatusLabels[status] : "Drone at drop-off",
        description:
          "The drone is in the drop-off sequence. Follow the next prompt when it appears.",
        detail: status
          ? missionStatusDescriptions[status]
          : "The handoff sequence is preparing.",
        badge: "At drop-off",
      };
    case "before_dropoff":
      return {
        title: "Drone en route to recipient",
        description:
          "The drone is moving toward your drop-off point. Prepare to be at the approved handoff location.",
        detail: "Move to the selected drop-off point when the drone is nearby.",
        badge: "En route",
      };
    default:
      return {
        title: "Recipient handoff pending",
        description: "Mission runtime is not available yet for this recipient view.",
        detail: "The handoff panel will update when a live mission is attached.",
        badge: "Pending",
      };
  }
}

function getTone(mode: RecipientPanelMode) {
  if (mode === "completed" || mode === "proof" || mode === "closed") {
    return "success" as const;
  }

  if (
    mode === "confirm_position" ||
    mode === "verify_pin" ||
    mode === "confirm_collection"
  ) {
    return "warning" as const;
  }

  return "info" as const;
}

function getPanelIcon(mode: RecipientPanelMode) {
  switch (mode) {
    case "confirm_position":
      return <Crosshair className="size-4" />;
    case "verify_pin":
      return <KeyRound className="size-4" />;
    case "confirm_collection":
      return <PackageCheck className="size-4" />;
    case "completed":
    case "proof":
    case "closed":
      return <CheckCircle2 className="size-4" />;
    case "at_dropoff":
      return <ShieldCheck className="size-4" />;
    default:
      return <Clock3 className="size-4" />;
  }
}

export function RecipientActionPanel() {
  const {
    currentMission,
    currentStatus,
    confirmRecipientPosition,
    verifyRecipientPin,
    confirmParcelCollected,
  } = useMissionRuntime();
  const [pinInputState, setPinInputState] = useState({
    key: "",
    value: "",
  });
  const mode = getPanelMode(currentStatus);
  const copy = getPanelCopy(mode, currentStatus);
  const recipientPin =
    currentMission?.pins.find((pin) => pin.purpose === "dropoff_verification") ??
    null;
  const pinInputKey = `${currentStatus ?? "none"}:${recipientPin?.id ?? "none"}`;
  const pinInput =
    pinInputState.key === pinInputKey ? pinInputState.value : "";
  const requiresPin = mode === "verify_pin";
  const canSubmit =
    mode === "confirm_position" ||
    mode === "confirm_collection" ||
    (requiresPin && pinInput.length === 4);

  const handleAction = () => {
    if (mode === "confirm_position") {
      confirmRecipientPosition();
      return;
    }

    if (mode === "verify_pin") {
      verifyRecipientPin(pinInput);
      return;
    }

    if (mode === "confirm_collection") {
      confirmParcelCollected();
    }
  };

  return (
    <SectionCard
      eyebrow="Handoff"
      title={copy.title}
      description={copy.description}
    >
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground">
            {getPanelIcon(mode)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{copy.title}</p>
              <StatusBadge label={copy.badge} tone={getTone(mode)} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.detail}
            </p>
          </div>
        </div>

        {requiresPin ? (
          <div className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Recipient PIN</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The locker opens only after PIN verification.
                </p>
              </div>
              {recipientPin ? (
                <StatusBadge label={maskMissionPin(recipientPin.code)} tone="neutral" />
              ) : null}
            </div>
            <Input
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]*"
              placeholder="Enter 4-digit PIN"
              value={pinInput}
              onChange={(event) =>
                setPinInputState({
                  key: pinInputKey,
                  value: event.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
            />
          </div>
        ) : null}

        {mode === "confirm_position" ||
        mode === "verify_pin" ||
        mode === "confirm_collection" ? (
          <AppButton
            type="button"
            onClick={handleAction}
            disabled={!canSubmit}
            className="h-11 w-full sm:w-fit"
          >
            {getPanelIcon(mode)}
            {mode === "confirm_position"
              ? "Confirm drone position"
              : mode === "verify_pin"
                ? "Verify PIN"
                : "Parcel collected"}
          </AppButton>
        ) : null}
      </div>
    </SectionCard>
  );
}
