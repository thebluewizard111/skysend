"use client";

import {
  Battery,
  Box,
  Gauge,
  LockKeyhole,
  Navigation,
  Radio,
  Signal,
  Weight,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  lockerStateLabels,
  missionStatusLabels,
} from "@/constants/mission";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { getNextMissionStatus } from "@/lib/mission-state-machine";

type MissionControlBarProps = {
  orderId: string;
  pickupLabel: string;
  dropoffLabel: string;
  statusLabel: string;
  urgencyLabel: string;
  etaLabel: string;
  priceLabel: string;
  droneClassLabel: string;
};

function formatSegmentLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatSpeed(value?: number | null) {
  if (!value) {
    return "0.0 m/s";
  }

  return `${value.toFixed(1)} m/s`;
}

export function MissionControlBar({
  orderId,
  pickupLabel,
  dropoffLabel,
  statusLabel,
  urgencyLabel,
  etaLabel,
  priceLabel,
  droneClassLabel,
}: MissionControlBarProps) {
  const {
    currentStatus,
    activeSegment,
    segmentProgress,
    lockerState,
    droneTelemetry,
    isMissionRunning,
    isWaitingForUser,
  } = useMissionRuntime();
  const nextStatus = currentStatus ? getNextMissionStatus(currentStatus) : null;
  const statusText = currentStatus
    ? missionStatusLabels[currentStatus]
    : "Preparing mission";
  const progressPercent = Math.round(segmentProgress * 100);
  const progressText = activeSegment
    ? `${progressPercent}% on ${formatSegmentLabel(activeSegment.type)}`
    : nextStatus
      ? `Next: ${missionStatusLabels[nextStatus]}`
      : etaLabel;
  const lockerText = lockerState ? lockerStateLabels[lockerState] : "Pending";
  const telemetryText = droneTelemetry
    ? `${droneTelemetry.batteryPercent}% battery / ${droneTelemetry.signalPercent}% signal`
    : "Telemetry pending";
  const speedText = droneTelemetry
    ? formatSpeed(droneTelemetry.groundSpeedMps)
    : "0.0 m/s";
  const payloadText =
    droneTelemetry?.payloadWeightKg && droneTelemetry.payloadWeightKg > 0
      ? `${droneTelemetry.payloadWeightKg.toFixed(1)} kg`
      : "No payload";

  return (
    <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
      <CardContent className="grid gap-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge
            label={isMissionRunning ? "Mission live" : "Mission ready"}
            tone={isMissionRunning ? "success" : "neutral"}
          />
          <StatusBadge
            label={statusText}
            tone={isWaitingForUser ? "warning" : "info"}
          />
          <StatusBadge label="Pitesti operations" tone="neutral" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Order {orderId}</p>
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Mission control for {pickupLabel} to {dropoffLabel}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Current operation: {progressText.toLocaleLowerCase("en-US")}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[42rem]">
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Radio className="size-4" />
                <p className="text-sm">Order</p>
              </div>
              <p className="mt-2 font-medium text-foreground">{statusLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{urgencyLabel}</p>
            </div>

            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Navigation className="size-4" />
                <p className="text-sm">Progress</p>
              </div>
              <p className="mt-2 font-medium text-foreground">{progressText}</p>
              <p className="mt-1 text-xs text-muted-foreground">ETA {etaLabel}</p>
            </div>

            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Box className="size-4" />
                <p className="text-sm">Drone</p>
              </div>
              <p className="mt-2 font-medium text-foreground">{droneClassLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Speed {speedText} / {priceLabel}
              </p>
            </div>

            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LockKeyhole className="size-4" />
                <p className="text-sm">Locker</p>
              </div>
              <p className="mt-2 font-medium text-foreground">{lockerText}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {droneTelemetry ? (
                  <Battery className="size-3.5" />
                ) : (
                  <Gauge className="size-3.5" />
                )}
                <span>{telemetryText}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 lg:col-start-2 lg:min-w-[42rem]">
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Battery className="size-3.5" />
                <span>Battery</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {droneTelemetry ? `${droneTelemetry.batteryPercent}%` : "Pending"}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Gauge className="size-3.5" />
                <span>Speed</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{speedText}</p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Signal className="size-3.5" />
                <span>Signal</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {droneTelemetry ? `${droneTelemetry.signalPercent}%` : "Pending"}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Weight className="size-3.5" />
                <span>Payload</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {payloadText} / {lockerText}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
