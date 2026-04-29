"use client";

import { CheckCircle2, Gauge, Scale, ShieldAlert } from "lucide-react";
import { droneClassLabels } from "@/constants/domain";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { DroneClass } from "@/types/domain";

type PayloadVerificationProps = {
  orderId: string;
  parcel: CreatedDeliveryOrder["payload"]["parcel"];
  droneClass: CreatedDeliveryOrder["payload"]["recommendedDroneClass"];
};

type WeightRange = {
  min: number;
  max: number;
  label: string;
};

type PayloadVerificationStatus =
  | "within_expected_range"
  | "minor_mismatch"
  | "requires_review";

const dronePayloadLimitsKg: Record<DroneClass, number> = {
  light_express: 1.5,
  standard_courier: 3.5,
  fragile_care: 2.5,
  long_range: 2.2,
  heavy_cargo: 8,
};

const statusCopy: Record<
  PayloadVerificationStatus,
  { label: string; tone: "success" | "warning" | "destructive"; message: string }
> = {
  within_expected_range: {
    label: "Within expected range",
    tone: "success",
    message: "Payload reading is aligned with intake estimate. Mission can continue.",
  },
  minor_mismatch: {
    label: "Minor mismatch",
    tone: "warning",
    message:
      "Payload reading is close to the intake estimate and remains inside drone limits.",
  },
  requires_review: {
    label: "Requires review",
    tone: "destructive",
    message:
      "Payload reading is outside the expected envelope or drone compatibility limit.",
  },
};

function parseWeightRange(range: string | null | undefined): WeightRange {
  if (!range) {
    return {
      min: 0.8,
      max: 2.2,
      label: "0.8 - 2.2 kg",
    };
  }

  const values = range
    .replace(",", ".")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => Number.isFinite(value));

  if (!values?.length) {
    return {
      min: 0.8,
      max: 2.2,
      label: range,
    };
  }

  const min = values[0];
  const max = values[1] ?? values[0];

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    label: range,
  };
}

function getStableOffset(seed: string) {
  const hash = Array.from(seed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return ((hash % 9) - 4) / 100;
}

function getMeasuredWeightKg(range: WeightRange, seed: string) {
  const midpoint = (range.min + range.max) / 2;
  const spread = Math.max(0.2, range.max - range.min);
  const measured = midpoint + spread * getStableOffset(seed);

  return Math.round(measured * 10) / 10;
}

function getVerificationStatus({
  measuredWeightKg,
  range,
  droneLimitKg,
}: {
  measuredWeightKg: number;
  range: WeightRange;
  droneLimitKg: number;
}): PayloadVerificationStatus {
  if (measuredWeightKg > droneLimitKg) {
    return "requires_review";
  }

  if (measuredWeightKg >= range.min && measuredWeightKg <= range.max) {
    return "within_expected_range";
  }

  const toleranceKg = Math.max(0.2, (range.max - range.min) * 0.15);
  const lowerBound = range.min - toleranceKg;
  const upperBound = range.max + toleranceKg;

  if (measuredWeightKg >= lowerBound && measuredWeightKg <= upperBound) {
    return "minor_mismatch";
  }

  return "requires_review";
}

export function PayloadVerification({
  orderId,
  parcel,
  droneClass,
}: PayloadVerificationProps) {
  const { currentMission, currentStatus } = useMissionRuntime();

  if (currentStatus !== "payload_verification") {
    return null;
  }

  const missionDroneClass = currentMission?.droneClass ?? droneClass;
  const range = parseWeightRange(parcel.estimatedWeightRange);
  const measuredWeightKg = getMeasuredWeightKg(range, `${orderId}:${parcel.category}`);
  const droneLimitKg = dronePayloadLimitsKg[missionDroneClass];
  const verificationStatus = getVerificationStatus({
    measuredWeightKg,
    range,
    droneLimitKg,
  });
  const copy = statusCopy[verificationStatus];

  return (
    <SectionCard
      eyebrow="Payload"
      title="Payload verification"
      description="Locker sensors are comparing the loaded parcel against the intake estimate."
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
              {verificationStatus === "requires_review" ? (
                <ShieldAlert className="size-4 text-foreground" />
              ) : (
                <CheckCircle2 className="size-4 text-foreground" />
              )}
            </span>
            <div>
              <p className="font-medium text-foreground">{copy.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {copy.message}
              </p>
            </div>
          </div>
          <StatusBadge label="Checking" tone={copy.tone} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Scale className="size-4" />
              Estimated range
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {range.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Intake estimate based on parcel size, packaging and contents.
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Gauge className="size-4" />
              Measured weight
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {measuredWeightKg.toFixed(1)} kg
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Locker sensor reading used for operational validation.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[var(--radius)] border border-border/80 bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              Drone compatibility
            </p>
            <StatusBadge
              label={
                measuredWeightKg <= droneLimitKg ? "Compatible" : "Over limit"
              }
              tone={measuredWeightKg <= droneLimitKg ? "success" : "destructive"}
            />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {droneClassLabels[missionDroneClass]} accepts payloads up to{" "}
            {droneLimitKg.toFixed(1)} kg for this mission profile.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
