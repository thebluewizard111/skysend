import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package2,
  Radar,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  deliveryUrgencyLabels,
  droneClassLabels,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/constants/domain";
import { roleConfigs } from "@/constants/roles";
import { createPageMetadata } from "@/lib/metadata";
import {
  getMockDroneClasses,
  getMockNotifications,
  getMockOrders,
  getMockPaymentRecords,
  getMockProfiles,
} from "@/lib/mock-data";
import { formatOrderStatus, getOrderProgress, sortOrdersByDate } from "@/lib/orders";
import type { DeliveryOrder, PaymentRecord } from "@/types/entities";

const config = roleConfigs.admin;

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

export const metadata = createPageMetadata(
  `${config.label} Dashboard`,
  "Operational control center for SkySend admin workflows in Pitesti.",
);

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Time not available";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOrderId(orderId: string) {
  return orderId.split("_").at(-1)?.replace(/^0+/, "") || orderId;
}

function getOrderTone(status: DeliveryOrder["status"]): StatusTone {
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

function getPaymentTone(status: PaymentRecord["status"]): StatusTone {
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
  }
}

function getReviewReason(order: DeliveryOrder, payment?: PaymentRecord) {
  if (order.status === "failed") {
    return order.cancellationReason ?? "Delivery failed and needs review.";
  }

  if (order.status === "cancelled") {
    return order.cancellationReason ?? "Order was cancelled before dispatch.";
  }

  if (payment?.status === "failed" || payment?.status === "refunded") {
    return payment.failureReason ?? `Payment is ${paymentStatusLabels[payment.status]}.`;
  }

  if (order.urgency === "critical" && order.status !== "delivered") {
    return "Critical delivery still needs close operational visibility.";
  }

  return "Review required before the mission can be closed cleanly.";
}

export default function AdminDashboardPage() {
  const orders = sortOrdersByDate(getMockOrders(), "createdAt", "desc");
  const profiles = getMockProfiles();
  const drones = getMockDroneClasses();
  const payments = getMockPaymentRecords();
  const notifications = getMockNotifications();

  const paymentByOrderId = new Map(
    payments.map((payment) => [payment.orderId, payment]),
  );
  const activeOrders = orders.filter((order) =>
    ["queued", "scheduled", "in_flight"].includes(order.status),
  );
  const failedOrders = orders.filter((order) => order.status === "failed");
  const pendingReviewOrders = orders.filter((order) => {
    const payment = paymentByOrderId.get(order.id);

    return (
      order.status === "failed" ||
      order.status === "cancelled" ||
      order.urgency === "critical" ||
      payment?.status === "failed" ||
      payment?.status === "refunded"
    );
  });
  const activeUsers = profiles.filter((profile) => profile.status === "active");
  const activeDrones = drones.filter((drone) => drone.isActive);
  const serviceEligibleOrders = orders.filter((order) => order.serviceAreaEligible);
  const coverageRate = Math.round(
    (serviceEligibleOrders.length / Math.max(orders.length, 1)) * 100,
  );
  const pendingPaymentValue = payments
    .filter((payment) => ["pending", "authorized"].includes(payment.status))
    .reduce((sum, payment) => sum + payment.amount.amountMinor, 0);
  const criticalNotifications = notifications.filter((notification) =>
    ["critical", "warning"].includes(notification.type),
  );

  return (
    <section className="app-container flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Pitesti operations control center."
        description="A compact command surface for live orders, manual review, fleet readiness and coverage health across the SkySend network."
        actions={[
          {
            label: "Orders",
            href: "/admin/orders",
            variant: "outline",
            icon: <Package2 className="size-4" />,
          },
          {
            label: "Manual Review",
            href: "/admin/manual-review",
            variant: "default",
            icon: <ShieldCheck className="size-4" />,
          },
          {
            label: "Failed Deliveries",
            href: "#failed-deliveries",
            variant: "outline",
            icon: <AlertTriangle className="size-4" />,
          },
          {
            label: "Fleet",
            href: "/admin/fleet",
            variant: "outline",
            icon: <Wrench className="size-4" />,
          },
        ]}
      />

      <Card
        id="overview"
        className="scroll-mt-24 rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]"
      >
        <CardContent className="grid gap-6 p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Pitesti live</Badge>
            <StatusBadge label="Operational" tone="success" />
            <StatusBadge
              label={`${pendingReviewOrders.length} review item${
                pendingReviewOrders.length === 1 ? "" : "s"
              }`}
              tone={pendingReviewOrders.length > 0 ? "warning" : "success"}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.55fr)]">
            <div className="space-y-3">
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Admin sees what needs attention before anything else.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                The main dashboard prioritizes active movement, exceptions,
                payment exposure, fleet readiness and coverage status. It is
                intentionally operational, not a dense analytics wall.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
                <p className="text-sm text-muted-foreground">Pending payment exposure</p>
                <p className="mt-2 font-heading text-3xl tracking-tight">
                  {formatCurrency(pendingPaymentValue, "RON")}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
                <p className="text-sm text-muted-foreground">Coverage status</p>
                <p className="mt-2 font-heading text-3xl tracking-tight">
                  {coverageRate}% eligible
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active orders"
          value={`${activeOrders.length}`}
          hint="Queued, scheduled and in-flight orders visible in the current Pitesti operating window."
          trend={<StatusBadge label="Live" tone="info" />}
        />
        <StatCard
          label="Pending reviews"
          value={`${pendingReviewOrders.length}`}
          hint="Critical, failed, cancelled or payment-sensitive records needing admin attention."
          trend={<StatusBadge label="Actionable" tone="warning" />}
        />
        <StatCard
          label="Failed deliveries"
          value={`${failedOrders.length}`}
          hint="Delivery exceptions that may require support, retry, refund or route review."
          trend={<StatusBadge label="Review" tone="destructive" />}
        />
        <StatCard
          label="Active users"
          value={`${activeUsers.length}`}
          hint="Client, operator and admin profiles currently active in the workspace."
          trend={<UsersRound className="size-4 text-foreground" />}
        />
      </div>

      <section
        id="needs-attention"
        className="grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]"
      >
        <SectionCard
          eyebrow="Needs Attention"
          title="Manual review queue"
          description="Admin starts here: delivery failures, critical urgency, cancelled work and payment exceptions are grouped together."
        >
          <div className="grid gap-3">
            {pendingReviewOrders.slice(0, 5).map((order) => {
              const payment = paymentByOrderId.get(order.id);

              return (
                <div
                  key={order.id}
                  className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        Order #{formatOrderId(order.id)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {deliveryUrgencyLabels[order.urgency]} /{" "}
                        {formatDateTime(order.scheduledFor)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={formatOrderStatus(order.status)}
                        tone={getOrderTone(order.status)}
                      />
                      {payment ? (
                        <StatusBadge
                          label={paymentStatusLabels[payment.status]}
                          tone={getPaymentTone(payment.status)}
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {getReviewReason(order, payment)}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Alerts"
          title="Operational signals"
          description="Only warnings and critical admin notifications are kept here."
        >
          <div className="grid gap-3">
            {criticalNotifications.length > 0 ? (
              criticalNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-foreground" />
                    <p className="font-medium text-foreground">
                      {notification.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {notification.body}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-7 text-muted-foreground">
                No critical admin alerts are open in the current operations window.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section id="orders" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
        <SectionCard
          eyebrow="Orders"
          title="Active order flow"
          description="A short operational list showing what is moving now and how far it is through the delivery lifecycle."
        >
          <div className="grid gap-3">
            {activeOrders.map((order) => {
              const progress = getOrderProgress(order);

              return (
                <div
                  key={order.id}
                  className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      Order #{formatOrderId(order.id)}
                    </p>
                    <StatusBadge
                      label={orderStatusLabels[order.status]}
                      tone={getOrderTone(order.status)}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {progress.label}. Drone class{" "}
                    {order.assignedDroneClassId
                      ? droneClassLabels[order.assignedDroneClassId]
                      : "pending assignment"}
                    . Scheduled {formatDateTime(order.scheduledFor)}.
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          id="failed-deliveries"
          eyebrow="Failed Deliveries"
          title="Exceptions with clear reasons"
          description="Failed missions are visible because they often trigger support, billing review or route policy decisions."
        >
          <div className="grid gap-3">
            {failedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-foreground">
                    Order #{formatOrderId(order.id)}
                  </p>
                  <StatusBadge label="Failed" tone="destructive" />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {order.cancellationReason ?? "Failure reason not available."}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard
          id="fleet"
          eyebrow="Fleet"
          title="Fleet status"
          description="Fleet readiness is summarized by active drone classes and the operational roles they cover."
        >
          <div className="grid gap-3">
            {drones.map((drone) => (
              <div
                key={drone.id}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{drone.config.name}</p>
                  <StatusBadge
                    label={drone.isActive ? "Available" : "Offline"}
                    tone={drone.isActive ? "success" : "warning"}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {drone.config.shortDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{drone.config.maxPayloadKg} kg payload</Badge>
                  <Badge variant="outline">{drone.config.estimatedRangeKm} km range</Badge>
                  <Badge variant="outline">
                    {drone.config.estimatedSpeedKph} kph cruise
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-5">
          <SectionCard
            id="network"
            eyebrow="Coverage"
            title="Coverage status Pitești"
            description="The admin view keeps the active service area visible without exposing map complexity on the dashboard."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
                <div className="flex items-center gap-3">
                  <Radar className="size-4 text-foreground" />
                  <p className="text-sm text-muted-foreground">Eligible orders</p>
                </div>
                <p className="mt-3 font-heading text-3xl tracking-tight">
                  {serviceEligibleOrders.length}/{orders.length}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-foreground" />
                  <p className="text-sm text-muted-foreground">Active classes</p>
                </div>
                <p className="mt-3 font-heading text-3xl tracking-tight">
                  {activeDrones.length}/{drones.length}
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Pitești is treated as the live service city in the current operations dataset.
              The dashboard highlights coverage eligibility and fleet readiness
              before deeper network tooling is built.
            </p>
          </SectionCard>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <AppButton asChild>
          <Link href="/admin/orders">
            Orders
            <ArrowRight className="size-4" />
          </Link>
        </AppButton>
        <AppButton asChild variant="outline">
          <Link href="/admin/manual-review">Manual Review</Link>
        </AppButton>
        <AppButton asChild variant="outline">
          <Link href="#failed-deliveries">Failed Deliveries</Link>
        </AppButton>
        <AppButton asChild variant="ghost">
          <Link href="/admin/fleet">Fleet</Link>
        </AppButton>
      </div>
    </section>
  );
}
