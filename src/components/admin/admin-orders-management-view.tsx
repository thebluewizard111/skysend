"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { FilterBar } from "@/components/shared/filter-bar";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  deliveryUrgencyLabels,
  orderStatusLabels,
} from "@/constants/domain";
import { cn } from "@/lib/utils";
import type {
  AdminOrderManagementRow,
  AdminOrderReviewStatus,
} from "@/types/admin-orders";
import type { DeliveryUrgency, OrderStatus } from "@/types/domain";

type AdminOrdersManagementViewProps = {
  orders: AdminOrderManagementRow[];
  initialReviewFilter?: ReviewFilter;
};

type PaymentFilter =
  | "all"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "missing";
type ReviewFilter = "all" | AdminOrderReviewStatus;
type StatusFilter = "all" | OrderStatus;
type UrgencyFilter = "all" | DeliveryUrgency;
type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Queued", value: "queued" },
  { label: "In flight", value: "in_flight" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Returned", value: "returned" },
];

const urgencyOptions: { label: string; value: UrgencyFilter }[] = [
  { label: "All urgency", value: "all" },
  { label: "Standard", value: "standard" },
  { label: "Priority", value: "priority" },
  { label: "Critical", value: "critical" },
];

const paymentOptions: { label: string; value: PaymentFilter }[] = [
  { label: "All payments", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Authorized", value: "authorized" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
  { label: "Missing", value: "missing" },
];

const reviewOptions: { label: string; value: ReviewFilter }[] = [
  { label: "All review states", value: "all" },
  { label: "Clear", value: "clear" },
  { label: "Needs review", value: "needs_review" },
  { label: "Resolved", value: "resolved" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOrderId(orderId: string) {
  return orderId.split("_").at(-1)?.replace(/^0+/, "") || orderId;
}

function getOrderTone(status: OrderStatus): StatusTone {
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

function getPaymentTone(
  status: AdminOrderManagementRow["paymentStatus"],
): StatusTone {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "destructive";
    case "refunded":
      return "info";
    case "pending":
    case "authorized":
      return "warning";
    case "missing":
      return "neutral";
  }
}

function getReviewLabel(status: AdminOrderReviewStatus) {
  switch (status) {
    case "needs_review":
      return "Needs review";
    case "resolved":
      return "Resolved";
    case "clear":
      return "Clear";
  }
}

function getReviewTone(status: AdminOrderReviewStatus): StatusTone {
  switch (status) {
    case "needs_review":
      return "warning";
    case "resolved":
      return "success";
    case "clear":
      return "neutral";
  }
}

function getDisplayReviewReason(
  order: AdminOrderManagementRow,
  reviewStatus: AdminOrderReviewStatus,
) {
  if (reviewStatus === "resolved") {
    return "Issue resolved in this session. Persist this state later through Supabase.";
  }

  if (reviewStatus === "needs_review" && order.reviewStatus === "clear") {
    return "Manually flagged for admin review in this session.";
  }

  return order.reviewReason;
}

export function AdminOrdersManagementView({
  orders,
  initialReviewFilter = "all",
}: AdminOrdersManagementViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [review, setReview] = useState<ReviewFilter>(initialReviewFilter);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id ?? null,
  );
  const [reviewOverrides, setReviewOverrides] = useState<
    Partial<Record<string, AdminOrderReviewStatus>>
  >({});

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        currentReviewStatus: reviewOverrides[order.id] ?? order.reviewStatus,
      })),
    [orders, reviewOverrides],
  );

  const normalizedSearch = search.trim().toLocaleLowerCase("en-US");
  const filteredOrders = rows.filter((order) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      order.id.toLocaleLowerCase("en-US").includes(normalizedSearch) ||
      order.clientName.toLocaleLowerCase("en-US").includes(normalizedSearch) ||
      (order.clientCompany ?? "")
        .toLocaleLowerCase("en-US")
        .includes(normalizedSearch) ||
      order.pickupSummary.toLocaleLowerCase("en-US").includes(normalizedSearch) ||
      order.dropoffSummary
        .toLocaleLowerCase("en-US")
        .includes(normalizedSearch);

    return (
      matchesSearch &&
      (status === "all" || order.status === status) &&
      (urgency === "all" || order.urgency === urgency) &&
      (payment === "all" || order.paymentStatus === payment) &&
      (review === "all" || order.currentReviewStatus === review)
    );
  });

  const selectedOrder =
    rows.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null;
  const needsReviewCount = rows.filter(
    (order) => order.currentReviewStatus === "needs_review",
  ).length;
  const resolvedCount = rows.filter(
    (order) => order.currentReviewStatus === "resolved",
  ).length;

  function updateReviewStatus(
    orderId: string,
    nextStatus: AdminOrderReviewStatus,
  ) {
    setReviewOverrides((current) => ({
      ...current,
      [orderId]: nextStatus,
    }));
    setSelectedOrderId(orderId);
  }

  return (
    <section className="app-container flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">Managed orders</p>
            <p className="font-heading text-3xl tracking-tight">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">Needs review</p>
            <p className="font-heading text-3xl tracking-tight">
              {needsReviewCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-2 p-5">
            <p className="text-sm text-muted-foreground">Resolved this session</p>
            <p className="font-heading text-3xl tracking-tight">
              {resolvedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, client, pickup or drop-off"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: (value) => setStatus(value as StatusFilter),
            options: statusOptions,
          },
          {
            id: "urgency",
            label: "Urgency",
            value: urgency,
            onChange: (value) => setUrgency(value as UrgencyFilter),
            options: urgencyOptions,
          },
          {
            id: "payment",
            label: "Payment",
            value: payment,
            onChange: (value) => setPayment(value as PaymentFilter),
            options: paymentOptions,
          },
          {
            id: "review",
            label: "Review",
            value: review,
            onChange: (value) => setReview(value as ReviewFilter),
            options: reviewOptions,
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
        <SectionCard
          eyebrow="Orders"
          title={`${filteredOrders.length} order${
            filteredOrders.length === 1 ? "" : "s"
          } visible`}
          description="Desktop uses a restrained administrative table. Mobile switches to cards so the same management actions remain readable."
        >
          <div className="hidden overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-border/80 xl:block">
            <table>
              <thead className="bg-secondary/45 text-left">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-4">Order</th>
                  <th className="px-4 py-4">Client</th>
                  <th className="px-4 py-4">Route</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Drone</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-t border-border/80 bg-card",
                      index === 0 && "border-t-0",
                    )}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">
                          #{formatOrderId(order.id)}
                        </p>
                        <StatusBadge
                          label={getReviewLabel(order.currentReviewStatus)}
                          tone={getReviewTone(order.currentReviewStatus)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <p className="font-medium text-foreground">
                        {order.clientName}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {order.clientCompany ?? "Independent client"}
                      </p>
                    </td>
                    <td className="max-w-[18rem] px-4 py-4 align-top text-sm text-muted-foreground">
                      <p className="truncate text-foreground">
                        {order.pickupSummary}
                      </p>
                      <p className="mt-1 truncate">to {order.dropoffSummary}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="grid gap-2">
                        <StatusBadge
                          label={orderStatusLabels[order.status]}
                          tone={getOrderTone(order.status)}
                        />
                        <Badge variant="outline" className="w-fit">
                          {deliveryUrgencyLabels[order.urgency]}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        label={order.paymentStatusLabel}
                        tone={getPaymentTone(order.paymentStatus)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {order.assignedDroneClassLabel}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <AppButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Eye className="size-4" />
                          View
                        </AppButton>
                        <AppButton
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateReviewStatus(order.id, "needs_review")
                          }
                        >
                          <ShieldAlert className="size-4" />
                          Review
                        </AppButton>
                        <AppButton
                          type="button"
                          size="sm"
                          onClick={() => updateReviewStatus(order.id, "resolved")}
                        >
                          <CheckCircle2 className="size-4" />
                          Resolve
                        </AppButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="rounded-[calc(var(--radius)+0.5rem)]"
              >
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        #{formatOrderId(order.id)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.clientName}
                      </p>
                    </div>
                    <StatusBadge
                      label={getReviewLabel(order.currentReviewStatus)}
                      tone={getReviewTone(order.currentReviewStatus)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={orderStatusLabels[order.status]}
                      tone={getOrderTone(order.status)}
                    />
                    <StatusBadge
                      label={deliveryUrgencyLabels[order.urgency]}
                      tone={order.urgency === "critical" ? "warning" : "neutral"}
                    />
                    <StatusBadge
                      label={order.paymentStatusLabel}
                      tone={getPaymentTone(order.paymentStatus)}
                    />
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="mt-1 font-medium text-foreground">
                        {order.pickupSummary}
                      </p>
                    </div>
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                      <p className="text-muted-foreground">Drop-off</p>
                      <p className="mt-1 font-medium text-foreground">
                        {order.dropoffSummary}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                      <p className="text-sm text-muted-foreground">Drone</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {order.assignedDroneClassLabel}
                      </p>
                    </div>
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <Search className="size-4" />
                      View details
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateReviewStatus(order.id, "needs_review")}
                    >
                      <ShieldAlert className="size-4" />
                      Mark for review
                    </AppButton>
                    <AppButton
                      type="button"
                      size="sm"
                      onClick={() => updateReviewStatus(order.id, "resolved")}
                    >
                      <CheckCircle2 className="size-4" />
                      Resolve issue
                    </AppButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Selected Order"
          title={selectedOrder ? `#${formatOrderId(selectedOrder.id)}` : "No order"}
          description="This side panel previews the operational reason behind review state changes."
        >
          {selectedOrder ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={getReviewLabel(selectedOrder.currentReviewStatus)}
                  tone={getReviewTone(selectedOrder.currentReviewStatus)}
                />
                <StatusBadge
                  label={orderStatusLabels[selectedOrder.status]}
                  tone={getOrderTone(selectedOrder.status)}
                />
              </div>

              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="mt-2 font-medium text-foreground">
                  {selectedOrder.clientName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedOrder.clientCompany ?? "Independent client"}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Review note</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {getDisplayReviewReason(
                    selectedOrder,
                    selectedOrder.currentReviewStatus,
                  )}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">Operational data</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Payment: {selectedOrder.paymentStatusLabel}
                  <br />
                  Drone: {selectedOrder.assignedDroneClassLabel}
                  <br />
                  Scheduled:{" "}
                  {selectedOrder.scheduledFor
                    ? formatDateTime(selectedOrder.scheduledFor)
                    : "Not scheduled"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateReviewStatus(selectedOrder.id, "needs_review")
                  }
                >
                  <ShieldAlert className="size-4" />
                  Mark for review
                </AppButton>
                <AppButton
                  type="button"
                  size="sm"
                  onClick={() => updateReviewStatus(selectedOrder.id, "resolved")}
                >
                  <CheckCircle2 className="size-4" />
                  Resolve issue
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateReviewStatus(selectedOrder.id, selectedOrder.reviewStatus)
                  }
                >
                  <RotateCcw className="size-4" />
                  Reset
                </AppButton>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              No order matches the current filters.
            </p>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
