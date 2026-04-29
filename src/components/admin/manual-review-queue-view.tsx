"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  UserCog,
  XCircle,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  AdminManualReviewItem,
  ManualReviewActionState,
  ManualReviewRiskLevel,
} from "@/types/admin-review";

type ManualReviewQueueViewProps = {
  items: AdminManualReviewItem[];
};

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOrderId(orderId: string) {
  return orderId.split("_").at(-1)?.replace(/^0+/, "") || orderId;
}

function getRiskTone(risk: ManualReviewRiskLevel): StatusTone {
  switch (risk) {
    case "high":
      return "destructive";
    case "medium":
      return "warning";
    case "low":
      return "info";
  }
}

function getRiskLabel(risk: ManualReviewRiskLevel) {
  switch (risk) {
    case "high":
      return "High risk";
    case "medium":
      return "Medium risk";
    case "low":
      return "Low risk";
  }
}

function getActionLabel(status: ManualReviewActionState) {
  switch (status) {
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    case "cancelled":
      return "Delivery cancelled";
    case "operator_assigned":
      return "Operator assigned";
    case "open":
      return "Open";
  }
}

function getActionTone(status: ManualReviewActionState): StatusTone {
  switch (status) {
    case "approved":
    case "operator_assigned":
      return "success";
    case "changes_requested":
      return "warning";
    case "cancelled":
      return "destructive";
    case "open":
      return "neutral";
  }
}

export function ManualReviewQueueView({ items }: ManualReviewQueueViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items[0]?.id ?? null,
  );
  const [actionStates, setActionStates] = useState<
    Partial<Record<string, ManualReviewActionState>>
  >({});

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        actionState: actionStates[item.id] ?? "open",
      })),
    [items, actionStates],
  );
  const selectedItem =
    rows.find((item) => item.id === selectedItemId) ?? rows[0] ?? null;
  const openCount = rows.filter((item) => item.actionState === "open").length;
  const highRiskCount = rows.filter((item) => item.riskLevel === "high").length;
  const assignedCount = rows.filter(
    (item) => item.actionState === "operator_assigned",
  ).length;

  function setItemAction(
    itemId: string,
    actionState: ManualReviewActionState,
  ) {
    setActionStates((current) => ({
      ...current,
      [itemId]: actionState,
    }));
    setSelectedItemId(itemId);
  }

  return (
    <section className="app-container flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">Open reviews</p>
            <p className="font-heading text-3xl tracking-tight">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">High risk</p>
            <p className="font-heading text-3xl tracking-tight">
              {highRiskCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">Assigned in session</p>
            <p className="font-heading text-3xl tracking-tight">
              {assignedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.44fr)]">
        <SectionCard
          eyebrow="Queue"
          title="Manual review items"
          description="Each item is specific enough for an operator decision, but the page stays calm and operational."
        >
          <div className="grid gap-3">
            {rows.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-secondary/45 p-5 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        Order #{formatOrderId(item.orderId)}
                      </Badge>
                      <StatusBadge
                        label={item.issueLabel}
                        tone="neutral"
                      />
                    </div>
                    <h3 className="font-heading text-xl tracking-tight text-foreground">
                      {item.shortExplanation}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={getRiskLabel(item.riskLevel)}
                      tone={getRiskTone(item.riskLevel)}
                    />
                    <StatusBadge
                      label={getActionLabel(item.actionState)}
                      tone={getActionTone(item.actionState)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted-foreground lg:grid-cols-3">
                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                    <p className="text-muted-foreground">Client</p>
                    <p className="mt-1 font-medium text-foreground">
                      {item.clientLabel}
                    </p>
                  </div>
                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                    <p className="text-muted-foreground">Route</p>
                    <p className="mt-1 font-medium text-foreground">
                      {item.routeSummary}
                    </p>
                  </div>
                  <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Recommended action: {item.recommendedAction}
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Decision"
          title={
            selectedItem
              ? `Order #${formatOrderId(selectedItem.orderId)}`
              : "No review item"
          }
          description="Actions update this browser session only. Later this maps cleanly to review status records in Supabase."
        >
          {selectedItem ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={selectedItem.issueLabel}
                  tone="neutral"
                />
                <StatusBadge
                  label={getRiskLabel(selectedItem.riskLevel)}
                  tone={getRiskTone(selectedItem.riskLevel)}
                />
                <StatusBadge
                  label={getActionLabel(selectedItem.actionState)}
                  tone={getActionTone(selectedItem.actionState)}
                />
              </div>

              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Short explanation</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {selectedItem.shortExplanation}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  Recommended action
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {selectedItem.recommendedAction}
                </p>
              </div>

              <div className="grid gap-2">
                <AppButton
                  type="button"
                  onClick={() => setItemAction(selectedItem.id, "approved")}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </AppButton>
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItemAction(selectedItem.id, "changes_requested")
                  }
                >
                  <MessageSquareText className="size-4" />
                  Request changes
                </AppButton>
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItemAction(selectedItem.id, "operator_assigned")
                  }
                >
                  <UserCog className="size-4" />
                  Assign operator
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={() => setItemAction(selectedItem.id, "cancelled")}
                >
                  <XCircle className="size-4" />
                  Cancel delivery
                </AppButton>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              The manual review queue is clear.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Supabase Ready"
        title="Review records can become a real workflow table"
        description="The current implementation separates review items from orders, which makes it straightforward to persist decisions later."
      >
        <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="size-4 text-foreground" />
            <p className="font-medium text-foreground">
              Suggested future table: manual_review_items
            </p>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Store order id, issue type, risk level, recommended action,
            assigned operator, status, decision notes and timestamps. The UI
            already treats each review item as its own record.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}
