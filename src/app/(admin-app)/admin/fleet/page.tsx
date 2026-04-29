import { ArrowLeft, BatteryCharging, Package2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminFleetStatusItems } from "@/lib/admin-fleet";
import { createPageMetadata } from "@/lib/metadata";
import type { AdminFleetAvailability } from "@/types/admin-fleet";

export const metadata = createPageMetadata(
  "Fleet Status",
  "Fleet readiness status for SkySend admin operations in Pitesti.",
);

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

function getAvailabilityTone(status: AdminFleetAvailability): StatusTone {
  switch (status) {
    case "available":
      return "success";
    case "assigned":
      return "info";
    case "charging":
      return "warning";
    case "maintenance":
    case "offline":
      return "destructive";
  }
}

function getBatteryTone(percent: number): StatusTone {
  if (percent >= 75) {
    return "success";
  }

  if (percent >= 45) {
    return "warning";
  }

  return "destructive";
}

export default function AdminFleetStatusPage() {
  const fleet = getAdminFleetStatusItems();
  const availableCount = fleet.filter(
    (item) => item.availability === "available",
  ).length;
  const assignedCount = fleet.filter(
    (item) => item.availability === "assigned",
  ).length;
  const serviceHoldCount = fleet.filter((item) =>
    ["maintenance", "offline"].includes(item.availability),
  ).length;
  const averageBattery = Math.round(
    fleet.reduce((sum, item) => sum + item.batteryPercent, 0) /
      Math.max(fleet.length, 1),
  );

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Fleet Status"
        title="Drone class readiness for the Pitesti operating window."
        description="A simple admin view of fleet availability, battery state, assigned work and maintenance posture. It is intentionally not a full fleet orchestration system."
        actions={[
          {
            label: "Back to Admin",
            href: "/admin",
            variant: "ghost",
            icon: <ArrowLeft className="size-4" />,
          },
          {
            label: "Orders",
            href: "/admin/orders",
            variant: "outline",
            icon: <Package2 className="size-4" />,
          },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available classes"
          value={`${availableCount}`}
          hint="Drone classes ready for a new task without maintenance or charging hold."
          trend={<StatusBadge label="Ready" tone="success" />}
        />
        <StatCard
          label="Assigned"
          value={`${assignedCount}`}
          hint="Classes currently tied to an active SkySend order."
          trend={<StatusBadge label="Live task" tone="info" />}
        />
        <StatCard
          label="Service holds"
          value={`${serviceHoldCount}`}
          hint="Maintenance and offline classes that should not receive new work."
          trend={<StatusBadge label="Do not assign" tone="warning" />}
        />
        <StatCard
          label="Average battery"
          value={`${averageBattery}%`}
          hint="Battery average across the five fleet classes."
          trend={<BatteryCharging className="size-4 text-foreground" />}
        />
      </div>

      <SectionCard
        eyebrow="Fleet"
        title="Drone class status"
        description="Each class shows only the signals an admin needs quickly: availability, battery, active task, maintenance and recommended use."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {fleet.map((item) => (
            <Card
              key={item.id}
              className="rounded-[calc(var(--radius)+0.5rem)] shadow-[var(--elevation-card)]"
            >
              <CardContent className="grid gap-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h2 className="font-heading text-2xl tracking-tight">
                      {item.name}
                    </h2>
                    <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <StatusBadge
                    label={item.availabilityLabel}
                    tone={getAvailabilityTone(item.availability)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                    <p className="text-sm text-muted-foreground">Battery</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge
                        label={item.batteryLabel}
                        tone={getBatteryTone(item.batteryPercent)}
                      />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.batteryPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                    <p className="text-sm text-muted-foreground">Active task</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {item.activeTaskLabel ?? "No active task"}
                    </p>
                    {item.activeTaskDetail ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.activeTaskDetail}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {item.maintenanceLabel}
                    </p>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                  <div className="flex items-center gap-3">
                    <Wrench className="size-4 text-foreground" />
                    <p className="font-medium text-foreground">Recommended use</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.recommendedUse}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{item.maxPayloadKg} kg payload</Badge>
                    <Badge variant="outline">{item.estimatedRangeKm} km range</Badge>
                    <Badge variant="outline">
                      {item.estimatedSpeedKph} kph cruise
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}
