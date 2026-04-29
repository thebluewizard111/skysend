"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  KeyRound,
  Loader2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import {
  lockerStateLabels,
  missionActionLabels,
  missionStatusDescriptions,
  missionStatusLabels,
} from "@/constants/mission";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { getNextMissionStatus } from "@/lib/mission-state-machine";
import { maskMissionPin } from "@/lib/mission-pin";
import type { MissionAction } from "@/types/mission";

function getActionDescription(action: MissionAction | null) {
  switch (action) {
    case "confirm_sender_position":
      return "Confirm the sender is standing at the approved pickup point before PIN verification.";
    case "verify_pickup_pin":
      return "Enter the pickup PIN to authorize locker descent and parcel loading.";
    case "confirm_parcel_loaded":
      return "Confirm the parcel has been placed inside the locker and is ready to secure.";
    case "confirm_recipient_position":
      return "Confirm the recipient is standing at the approved drop-off point before PIN verification.";
    case "verify_recipient_pin":
      return "Enter the recipient PIN to authorize locker descent and parcel collection.";
    case "confirm_parcel_collected":
      return "Confirm the recipient has collected the parcel from the locker.";
    case "trigger_fallback":
      return "Operator handling is required before this mission can continue.";
    default:
      return "The mission is advancing through the current operational step.";
  }
}

function getButtonLabel(action: MissionAction | null) {
  switch (action) {
    case "confirm_sender_position":
    case "confirm_recipient_position":
      return "Confirm position";
    case "verify_pickup_pin":
    case "verify_recipient_pin":
      return "Verify PIN";
    case "confirm_parcel_loaded":
      return "Parcel loaded";
    case "confirm_parcel_collected":
      return "Parcel collected";
    default:
      return "Waiting for mission";
  }
}

function getActionIcon(action: MissionAction | null) {
  switch (action) {
    case "verify_pickup_pin":
    case "verify_recipient_pin":
      return <KeyRound className="size-4" />;
    case "confirm_parcel_loaded":
    case "confirm_parcel_collected":
      return <PackageCheck className="size-4" />;
    case "confirm_sender_position":
    case "confirm_recipient_position":
      return <Crosshair className="size-4" />;
    default:
      return <ShieldCheck className="size-4" />;
  }
}

export function MissionActionPanel() {
  const {
    currentMission,
    currentStatus,
    lockerState,
    droneTelemetry,
    pendingAction,
    isWaitingForUser,
    confirmSenderPosition,
    verifyPickupPin,
    confirmParcelLoaded,
    confirmRecipientPosition,
    verifyRecipientPin,
    confirmParcelCollected,
  } = useMissionRuntime();
  const [pinInputState, setPinInputState] = useState({
    key: "",
    value: "",
  });
  const nextStatus = currentStatus ? getNextMissionStatus(currentStatus) : null;
  const isPickupPin = pendingAction === "verify_pickup_pin";
  const isRecipientPin = pendingAction === "verify_recipient_pin";
  const activePin = useMemo(() => {
    const purpose = isPickupPin
      ? "pickup_verification"
      : isRecipientPin
        ? "dropoff_verification"
        : null;

    if (!purpose) {
      return null;
    }

    return currentMission?.pins.find((pin) => pin.purpose === purpose) ?? null;
  }, [currentMission?.pins, isPickupPin, isRecipientPin]);
  const requiresPin = Boolean(isPickupPin || isRecipientPin);
  const pinInputKey = `${pendingAction ?? "none"}:${activePin?.id ?? "none"}`;
  const pinInput =
    pinInputState.key === pinInputKey ? pinInputState.value : "";
  const canSubmit = pendingAction
    ? requiresPin
      ? pinInput.trim().length === 4
      : true
    : false;

  const handleAction = () => {
    switch (pendingAction) {
      case "confirm_sender_position":
        confirmSenderPosition();
        break;
      case "verify_pickup_pin":
        verifyPickupPin(pinInput);
        break;
      case "confirm_parcel_loaded":
        confirmParcelLoaded();
        break;
      case "confirm_recipient_position":
        confirmRecipientPosition();
        break;
      case "verify_recipient_pin":
        verifyRecipientPin(pinInput);
        break;
      case "confirm_parcel_collected":
        confirmParcelCollected();
        break;
      default:
        break;
    }
  };

  return (
    <SectionCard
      eyebrow="Action"
      title="Mission action panel"
      description={
        pendingAction
          ? getActionDescription(pendingAction)
          : nextStatus
            ? `Next operation: ${missionStatusLabels[nextStatus]}.`
            : "The mission has no pending user action."
      }
    >
      <div className="grid gap-4">
        <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
                {isWaitingForUser ? (
                  getActionIcon(pendingAction)
                ) : (
                  <Loader2 className="size-4" />
                )}
              </span>
              <div>
                <p className="font-medium text-foreground">
                  {pendingAction
                    ? missionActionLabels[pendingAction]
                    : currentStatus
                      ? missionStatusLabels[currentStatus]
                      : "Preparing mission"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingAction
                    ? getActionDescription(pendingAction)
                    : nextStatus
                      ? missionStatusDescriptions[nextStatus]
                      : "Operational closeout is complete."}
                </p>
              </div>
            </div>
            <StatusBadge
              label={isWaitingForUser ? "User action" : "Auto step"}
              tone={isWaitingForUser ? "warning" : "info"}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">Locker</p>
              <p className="mt-1 font-medium text-foreground">
                {lockerState ? lockerStateLabels[lockerState] : "Pending"}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
              <p className="text-sm text-muted-foreground">Telemetry</p>
              <p className="mt-1 font-medium text-foreground">
                {droneTelemetry
                  ? `${droneTelemetry.batteryPercent}% battery / ${droneTelemetry.signalPercent}% signal`
                  : "Pending"}
              </p>
            </div>
          </div>
        </div>

        {requiresPin ? (
          <div className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">
                  {isPickupPin ? "Pickup PIN" : "Recipient PIN"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Secure handoff code for this mission.
                </p>
              </div>
              {activePin ? (
                <StatusBadge
                  label={`${maskMissionPin(activePin.code)} / ${activePin.code}`}
                  tone="neutral"
                />
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

        <AppButton
          type="button"
          onClick={handleAction}
          disabled={!canSubmit}
          className="h-11 w-full sm:w-fit"
        >
          {pendingAction ? (
            getActionIcon(pendingAction)
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {getButtonLabel(pendingAction)}
        </AppButton>
      </div>
    </SectionCard>
  );
}
