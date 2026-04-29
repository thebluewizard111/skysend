"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  Route,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderStatus } from "@/types/domain";
import type {
  OperatorDashboardData,
  OperatorTask,
  OperatorTaskActionState,
} from "@/types/operator-dashboard";

type OperatorDashboardViewProps = {
  data: OperatorDashboardData;
};

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "No dispatch window";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOrderId(orderId: string) {
  return orderId.split("_").at(-1)?.replace(/^0+/, "") || orderId;
}

function getStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
    case "cancelled":
    case "returned":
      return "destructive";
    case "queued":
    case "scheduled":
      return "warning";
    case "in_flight":
      return "info";
    default:
      return "neutral";
  }
}

function getPriorityTone(priority: OperatorTask["priority"]): StatusTone {
  switch (priority) {
    case "critical":
      return "destructive";
    case "priority":
      return "warning";
    case "standard":
      return "neutral";
  }
}

function getActionLabel(action?: OperatorTaskActionState) {
  switch (action) {
    case "pickup_started":
      return "Pickup validation started";
    case "package_loaded":
      return "Package loaded";
    case "dropoff_started":
      return "Drop-off validation started";
    case "issue_reported":
      return "Issue reported";
    case "open":
    case undefined:
      return "Open";
  }
}

function getActionTone(action?: OperatorTaskActionState): StatusTone {
  switch (action) {
    case "package_loaded":
      return "success";
    case "pickup_started":
    case "dropoff_started":
      return "info";
    case "issue_reported":
      return "destructive";
    case "open":
    case undefined:
      return "neutral";
  }
}

function TaskCard({
  task,
  actionState,
  onAction,
  compact = false,
}: {
  task: OperatorTask;
  actionState?: OperatorTaskActionState;
  onAction: (taskId: string, action: OperatorTaskActionState) => void;
  compact?: boolean;
}) {
  return (
    <Card className="rounded-[calc(var(--radius)+0.5rem)] shadow-[var(--elevation-card)]">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Order #{formatOrderId(task.orderId)}</Badge>
              <StatusBadge
                label={task.statusLabel}
                tone={getStatusTone(task.status)}
              />
              <StatusBadge
                label={task.priorityLabel}
                tone={getPriorityTone(task.priority)}
              />
            </div>
            <h3 className="font-heading text-xl tracking-tight text-foreground">
              {task.requiredAction}
            </h3>
          </div>
          <StatusBadge
            label={getActionLabel(actionState)}
            tone={getActionTone(actionState)}
          />
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
            <p className="text-muted-foreground">Pickup</p>
            <p className="mt-1 font-medium text-foreground">
              {task.pickupSummary}
            </p>
          </div>
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
            <p className="text-muted-foreground">Drop-off</p>
            <p className="mt-1 font-medium text-foreground">
              {task.dropoffSummary}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
            <p className="text-muted-foreground">Assigned drone class</p>
            <p className="mt-1 font-medium text-foreground">
              {task.assignedDroneClassLabel}
            </p>
          </div>
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
            <p className="text-muted-foreground">Dispatch window</p>
            <p className="mt-1 font-medium text-foreground">
              {formatDateTime(task.scheduledFor)}
            </p>
          </div>
        </div>

        {task.issueSummary ? (
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">Incident context</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {task.issueSummary}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <AppButton
            type="button"
            size={compact ? "sm" : "default"}
            variant="outline"
            onClick={() => onAction(task.id, "pickup_started")}
          >
            <ClipboardCheck className="size-4" />
            Start pickup validation
          </AppButton>
          <AppButton
            type="button"
            size={compact ? "sm" : "default"}
            onClick={() => onAction(task.id, "package_loaded")}
          >
            <PackageCheck className="size-4" />
            Confirm package loaded
          </AppButton>
          <AppButton
            type="button"
            size={compact ? "sm" : "default"}
            variant="outline"
            onClick={() => onAction(task.id, "dropoff_started")}
          >
            <Route className="size-4" />
            Start drop-off validation
          </AppButton>
          <AppButton
            type="button"
            size={compact ? "sm" : "default"}
            variant="ghost"
            onClick={() => onAction(task.id, "issue_reported")}
          >
            <AlertTriangle className="size-4" />
            Report issue
          </AppButton>
        </div>
      </CardContent>
    </Card>
  );
}

export function OperatorDashboardView({ data }: OperatorDashboardViewProps) {
  const [taskActions, setTaskActions] = useState<
    Partial<Record<string, OperatorTaskActionState>>
  >({});

  function updateTaskAction(
    taskId: string,
    action: OperatorTaskActionState,
  ) {
    setTaskActions((current) => ({
      ...current,
      [taskId]: action,
    }));
  }

  return (
    <section className="app-container flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current assigned task"
          value={data.currentTask ? `#${formatOrderId(data.currentTask.orderId)}` : "None"}
          hint="The task the operator should handle first in the active Pitesti shift."
          trend={<StatusBadge label="Now" tone="info" />}
        />
        <StatCard
          label="Upcoming tasks"
          value={`${data.upcomingTasks.length}`}
          hint="Scheduled or queued work visible after the current task."
          trend={<StatusBadge label="Queue" tone="warning" />}
        />
        <StatCard
          label="Pickup validations"
          value={`${data.pickupValidations.length}`}
          hint="Pickup points that still need readiness or loading validation."
          trend={<StatusBadge label="Pending" tone="warning" />}
        />
        <StatCard
          label="Incidents"
          value={`${data.incidents.length}`}
          hint="Failures or warning signals that require operator action."
          trend={<StatusBadge label="Action" tone="destructive" />}
        />
      </div>

      <section id="missions" className="grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
        <SectionCard
          eyebrow="Current Task"
          title="Handle this first"
          description="The operator dashboard is intentionally task-first: one current assignment, then the next operational queues."
        >
          {data.currentTask ? (
            <TaskCard
              task={data.currentTask}
              actionState={taskActions[data.currentTask.id]}
              onAction={updateTaskAction}
            />
          ) : (
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5 text-sm leading-7 text-muted-foreground">
              No current operator task is assigned in this shift.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Upcoming"
          title="Next tasks"
          description="A compact queue for what the operator should scan after the current task."
        >
          <div className="grid gap-3">
            {data.upcomingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actionState={taskActions[task.id]}
                onAction={updateTaskAction}
                compact
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <section id="pads" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
        <SectionCard
          eyebrow="Pickup Validations"
          title="Pickup points pending"
          description="These tasks focus on package readiness, pickup point clarity and loading confirmation."
        >
          <div className="grid gap-3">
            {data.pickupValidations.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actionState={taskActions[task.id]}
                onAction={updateTaskAction}
                compact
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Drop-off Validations"
          title="Drop-off points pending"
          description="Drop-off validation keeps recipient handoff and pad readiness visible before completion."
        >
          <div className="grid gap-3">
            {data.dropoffValidations.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actionState={taskActions[task.id]}
                onAction={updateTaskAction}
                compact
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <section id="alerts" className="scroll-mt-24">
        <SectionCard
          eyebrow="Incidents"
          title="Incidents requiring action"
          description="Incident cards stay direct and calm: what happened, which order it belongs to and what the operator can do next."
        >
          <div className="grid gap-3 xl:grid-cols-2">
            {data.incidents.length > 0 ? (
              data.incidents.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  actionState={taskActions[task.id]}
                  onAction={updateTaskAction}
                  compact
                />
              ))
            ) : (
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5 text-sm leading-7 text-muted-foreground">
                No operator incidents are currently open.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </section>
  );
}
