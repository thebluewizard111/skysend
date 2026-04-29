"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrdersEmptyState } from "@/components/shared/domain-empty-states";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { orderStatusLabels } from "@/constants/domain";
import { AppButton } from "@/components/shared/app-button";
import { formatDeliveryUrgency } from "@/lib/orders";
import { readCreatedDeliveryOrders } from "@/lib/create-delivery-submit";
import { cn } from "@/lib/utils";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { ClientOrderStatusFilter, ClientOrderSummary } from "@/types/client-orders";

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Cancelled", value: "cancelled" },
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(order: ClientOrderSummary) {
  if (order.statusFilter === "active") {
    return "Active";
  }

  switch (order.statusFilter) {
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "scheduled":
      return "Scheduled";
    case "cancelled":
      return "Cancelled";
    default:
      return orderStatusLabels[order.status];
  }
}

function getStatusTone(order: ClientOrderSummary): StatusTone {
  switch (order.statusFilter) {
    case "completed":
      return "success";
    case "failed":
      return "destructive";
    case "scheduled":
      return "warning";
    case "cancelled":
      return "neutral";
    case "active":
      return "info";
    default:
      return "neutral";
  }
}

function getPaymentTone(
  status: ClientOrderSummary["payment"]["status"],
): StatusTone {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "destructive";
    case "refunded":
      return "warning";
    case "unpaid":
      return "warning";
    case "processing":
      return "info";
    case "pending":
      return "info";
  }
}

function formatRuntimeCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function mapRuntimePaymentStatus(
  order: CreatedDeliveryOrder,
): ClientOrderSummary["payment"]["status"] {
  switch (order.paymentStatus ?? "unpaid") {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    case "processing":
      return "processing";
    default:
      return "unpaid";
  }
}

function mapRuntimeOrderStatus(order: CreatedDeliveryOrder): ClientOrderSummary {
  const paymentStatus = mapRuntimePaymentStatus(order);
  const fulfillmentStatus = order.fulfillmentStatus ?? "order_created";
  const isUnpaid = paymentStatus === "unpaid" || paymentStatus === "processing";
  const statusFilter: ClientOrderStatusFilter =
    isUnpaid || fulfillmentStatus === "order_created"
      ? "scheduled"
      : fulfillmentStatus === "completed_mission"
        ? "completed"
        : fulfillmentStatus === "failed_mission" ||
            fulfillmentStatus === "fallback_required"
          ? "failed"
          : "active";
  const operationalStateLabel = isUnpaid
    ? "Unpaid order"
    : fulfillmentStatus === "completed_mission"
      ? "Completed mission"
      : fulfillmentStatus === "failed_mission"
        ? "Failed mission"
        : fulfillmentStatus === "fallback_required"
          ? "Fallback mission"
          : "Active mission";

  return {
    id: order.id,
    href: order.href,
    pickupArea: order.payload.selectedPickupPoint.label,
    dropoffArea: order.payload.selectedDropoffPoint.label,
    status:
      statusFilter === "completed"
        ? "delivered"
        : statusFilter === "failed"
          ? "failed"
          : statusFilter === "active"
            ? "in_flight"
            : "scheduled",
    statusFilter,
    urgency:
      order.payload.urgency === "scheduled"
        ? "standard"
        : order.payload.urgency,
    createdAt: order.payload.createdAt,
    scheduledFor: null,
    estimatedCostLabel: formatRuntimeCurrency(
      order.payload.estimatedPrice.amountMinor,
      order.payload.estimatedPrice.currency,
    ),
    payment: {
      id: order.stripePaymentIntentId ?? null,
      status: paymentStatus,
      statusLabel:
        paymentStatus === "paid"
          ? "Paid"
          : paymentStatus === "failed"
            ? "Failed"
            : paymentStatus === "refunded"
              ? "Refunded"
              : paymentStatus === "processing"
                ? "Processing"
                : "Unpaid",
      methodLabel: "Secure card payment",
      methodDetail:
        paymentStatus === "paid"
          ? "Card payment confirmed"
          : "Payment required before dispatch",
      amountLabel: formatRuntimeCurrency(
        order.payload.estimatedPrice.amountMinor,
        order.payload.estimatedPrice.currency,
      ),
      hasPaymentIssue: paymentStatus === "failed" || paymentStatus === "refunded",
    },
    operationalStateLabel,
    isRuntimeOrder: true,
  };
}

export function ClientOrdersView({
  orders,
}: {
  orders: ClientOrderSummary[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientOrderStatusFilter>("all");
  const [runtimeOrders, setRuntimeOrders] = useState<ClientOrderSummary[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRuntimeOrders(readCreatedDeliveryOrders().map(mapRuntimeOrderStatus));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const allOrders = useMemo(() => {
    const runtimeIds = new Set(runtimeOrders.map((order) => order.id));

    return [
      ...runtimeOrders,
      ...orders.filter((order) => !runtimeIds.has(order.id)),
    ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }, [orders, runtimeOrders]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = allOrders.filter((order) => {
    const matchesStatus = status === "all" || order.statusFilter === status;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      order.id.toLowerCase().includes(normalizedSearch) ||
      order.pickupArea.toLowerCase().includes(normalizedSearch) ||
      order.dropoffArea.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Client Orders"
        title="Orders moving through the Pitesti delivery flow."
        description="Search, filter and scan every client order through one clean list. Each row keeps the essentials visible and links directly to the order details view."
        actions={[
          {
            label: "Back to dashboard",
            href: "/client",
            variant: "outline",
          },
          {
            label: "Failed orders",
            href: "/client/orders/failed",
            variant: "outline",
          },
          {
            label: "Create delivery",
            href: "/client/create-delivery",
            variant: "default",
          },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order id or Pitesti area"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: (value) => setStatus(value as ClientOrderStatusFilter),
            options: statusOptions.map((option) => ({
              label: option.label,
              value: option.value,
            })),
          },
        ]}
      />

      {filteredOrders.length === 0 ? (
        <OrdersEmptyState />
      ) : (
        <SectionCard
          eyebrow="Orders"
          title={`${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} visible`}
          description="Desktop uses a structured table for denser scanning, while mobile keeps the same data in stacked cards with large touch targets."
        >
          <div className="hidden overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-border/80 lg:block">
            <table>
              <thead className="bg-secondary/45 text-left">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-4">Order</th>
                  <th className="px-4 py-4">Route</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Urgency</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Estimated cost</th>
                  <th className="px-4 py-4 text-right">Details</th>
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
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.operationalStateLabel ??
                          (order.scheduledFor
                            ? `Window ${formatDateTime(order.scheduledFor)}`
                            : "Created immediately")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground">{order.pickupArea}</p>
                        <p className="text-muted-foreground">
                          to {order.dropoffArea}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        label={order.operationalStateLabel ?? getStatusLabel(order)}
                        tone={getStatusTone(order)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        label={order.payment.statusLabel}
                        tone={getPaymentTone(order.payment.status)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDeliveryUrgency(order.urgency)}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-medium text-foreground">
                      {order.estimatedCostLabel}
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <AppButton asChild variant="ghost" size="sm">
                        <Link href={order.href}>
                          View details
                          <ArrowRight className="size-4" />
                        </Link>
                      </AppButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="rounded-[calc(var(--radius)+0.5rem)]">
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.operationalStateLabel ?? formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={order.operationalStateLabel ?? getStatusLabel(order)}
                      tone={getStatusTone(order)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={`Payment ${order.payment.statusLabel.toLocaleLowerCase("en-US")}`}
                      tone={getPaymentTone(order.payment.status)}
                    />
                    <StatusBadge label={order.payment.methodDetail} tone="neutral" />
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                      <p className="text-muted-foreground">Pickup area</p>
                      <p className="mt-1 font-medium text-foreground">
                        {order.pickupArea}
                      </p>
                    </div>
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3">
                      <p className="text-muted-foreground">Drop-off area</p>
                      <p className="mt-1 font-medium text-foreground">
                        {order.dropoffArea}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                      <p className="text-sm text-muted-foreground">Urgency</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDeliveryUrgency(order.urgency)}
                      </p>
                    </div>
                    <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                      <p className="text-sm text-muted-foreground">Estimated cost</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {order.estimatedCostLabel}
                      </p>
                    </div>
                  </div>

                  <AppButton asChild variant="outline" size="lg">
                    <Link href={order.href}>
                      View details
                      <Search className="size-4" />
                    </Link>
                  </AppButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>
      )}
    </section>
  );
}
