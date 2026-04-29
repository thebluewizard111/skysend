"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { getMissionStepConfig } from "@/lib/mission-state-machine";
import type { MissionStatus } from "@/types/mission";

const safetyCheckStatuses: MissionStatus[] = [
  "pickup_safety_check",
  "dropoff_safety_check",
];

const checklistItems = [
  "Hover position stable",
  "Cable lock verified",
  "Descent area clear",
  "Wind tolerance acceptable",
  "Locker release authorized",
] as const;

function isSafetyCheckStatus(status: MissionStatus | null): status is MissionStatus {
  return Boolean(status && safetyCheckStatuses.includes(status));
}

function getSafetyContext(status: MissionStatus | null) {
  if (status === "pickup_safety_check") {
    return {
      label: "Pickup descent check",
      description:
        "The system is validating the pickup zone before lowering the locker.",
    };
  }

  if (status === "dropoff_safety_check") {
    return {
      label: "Drop-off descent check",
      description:
        "The system is validating the drop-off zone before lowering the locker.",
    };
  }

  return {
    label: "Safety checks standing by",
    description:
      "Descent checks will run before the next locker lowering sequence.",
  };
}

type SafetyContext = ReturnType<typeof getSafetyContext>;

export function SafetyChecklist() {
  const { currentStatus } = useMissionRuntime();

  if (!isSafetyCheckStatus(currentStatus)) {
    return null;
  }

  const context = getSafetyContext(currentStatus);
  const durationSeconds = getMissionStepConfig(currentStatus).durationSeconds ?? 4;

  return (
    <ActiveSafetyChecklist
      key={currentStatus}
      context={context}
      durationSeconds={durationSeconds}
    />
  );
}

function ActiveSafetyChecklist({
  context,
  durationSeconds,
}: {
  context: SafetyContext;
  durationSeconds: number;
}) {
  const [statusStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const checkedCount = useMemo(() => {
    const elapsedMs = Math.max(0, now - statusStartedAt);
    const progress = Math.min(1, elapsedMs / (durationSeconds * 1000));

    return Math.min(
      checklistItems.length,
      Math.floor(progress * checklistItems.length) + 1,
    );
  }, [durationSeconds, now, statusStartedAt]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 220);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <SafetyChecklistContent
      checkedCount={checkedCount}
      context={context}
      isActive
    />
  );
}

function SafetyChecklistContent({
  checkedCount,
  context,
  isActive,
}: {
  checkedCount: number;
  context: SafetyContext;
  isActive: boolean;
}) {
  return (
    <SectionCard
      eyebrow="Safety"
      title="Descent safety checklist"
      description={context.description}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
              <ShieldCheck className="size-4 text-foreground" />
            </span>
            <div>
              <p className="font-medium text-foreground">{context.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isActive
                  ? `${checkedCount} of ${checklistItems.length} checks cleared`
                  : "Waiting for descent authorization window"}
              </p>
            </div>
          </div>
          <StatusBadge
            label={isActive ? "Checking" : "Standby"}
            tone={isActive ? "info" : "neutral"}
          />
        </div>

        <div className="grid gap-2">
          {checklistItems.map((item, index) => {
            const isChecked = index < checkedCount;

            return (
              <div
                key={item}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border/80 bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-foreground transition-colors">
                    {isChecked ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isChecked ? "Clear" : isActive ? "Checking" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
