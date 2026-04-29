import { Route, Wallet } from "lucide-react";
import { ClientOverviewActions } from "@/components/dashboard/client-overview-actions";
import { ClientRuntimeStats } from "@/components/dashboard/client-runtime-stats";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { paymentStatusLabels } from "@/constants/domain";
import { roleConfigs } from "@/constants/roles";
import {
  getMockClientDashboardStats,
  getMockNotifications,
  getMockOrders,
  getMockPaymentRecords,
  getMockUserProfile,
} from "@/lib/mock-data";
import {
  formatDeliveryUrgency,
  formatOrderStatus,
  getOrderProgress,
  sortOrdersByDate,
} from "@/lib/orders";
import { createPageMetadata } from "@/lib/metadata";

const config = roleConfigs.client;

export const metadata = createPageMetadata(
  `${config.label} Dashboard`,
  config.description,
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
  const compact = orderId.split("_").at(-1) ?? orderId;
  return compact.replace(/^0+/, "") || compact;
}

function getOrderTone(status: ReturnType<typeof getMockOrders>[number]["status"]) {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
    case "cancelled":
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

function getPaymentTone(status: ReturnType<typeof getMockPaymentRecords>[number]["status"]) {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "destructive";
    case "pending":
    case "authorized":
      return "warning";
    case "refunded":
      return "info";
    default:
      return "neutral";
  }
}

type ActivityTone = "neutral" | "success" | "warning" | "destructive" | "info";

function getActivityTone(
  type: ReturnType<typeof getMockNotifications>[number]["type"],
): ActivityTone {
  switch (type) {
    case "critical":
      return "destructive";
    case "warning":
      return "warning";
    case "system":
      return "info";
    default:
      return "neutral";
  }
}

export default function ClientDashboardPage() {
  const profile = getMockUserProfile();
  const stats = getMockClientDashboardStats();
  const orders = sortOrdersByDate(getMockOrders(), "createdAt", "desc");
  const paymentRecords = getMockPaymentRecords();
  const notifications = getMockNotifications()
    .filter((notification) => notification.userProfileId === profile.id)
    .sort(
      (left, right) =>
        Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

  const paymentByOrderId = new Map(
    paymentRecords.map((payment) => [payment.orderId, payment]),
  );

  const activeOrders = orders.filter((order) =>
    ["queued", "scheduled", "in_flight"].includes(order.status),
  );
  const completedOrders = orders.filter((order) => order.status === "delivered");
  const failedOrders = orders.filter((order) => order.status === "failed");
  const latestOrder = activeOrders[0] ?? orders[0] ?? null;

  const recentActivity = [
    ...notifications.map((notification) => ({
      key: notification.id,
      time: notification.createdAt,
      title: notification.title,
      body: notification.body,
      meta: "Notification",
      tone: getActivityTone(notification.type),
    })),
    ...orders.slice(0, 3).map((order) => ({
      key: `activity-${order.id}`,
      time: order.updatedAt,
      title: `Order ${formatOrderId(order.id)} is ${formatOrderStatus(order.status).toLowerCase()}`,
      body:
        order.cancellationReason ??
        `${formatDeliveryUrgency(order.urgency)} priority order updated at ${formatDateTime(order.updatedAt)}.`,
      meta: "Order update",
      tone: getOrderTone(order.status) as ActivityTone,
    })),
  ]
    .sort((left, right) => Date.parse(right.time) - Date.parse(left.time))
    .slice(0, 5);

  return (
    <section className="app-container flex flex-col gap-8">
      <PageHeader
        eyebrow="Client Overview"
        title={`Welcome back, ${profile.fullName.split(" ")[0]}.`}
        description="SkySend is active in Pitesti. This overview keeps deliveries, mission status and billing visible without crowding the workspace."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
          <CardContent className="grid gap-6 p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Pitesti live</Badge>
              <StatusBadge label="Client workspace" tone="info" />
            </div>

            <div className="space-y-3">
              <h2 className="type-h2">Your delivery flow is active now.</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Track current missions, review delivery outcomes and keep the next
                order moving through the active Pitesti service area with one
                compact overview.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Next order</p>
                <p className="mt-2 font-heading text-2xl tracking-tight">
                  {stats.nextOrderId ? `#${formatOrderId(stats.nextOrderId)}` : "Not queued"}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Average ETA</p>
                <p className="mt-2 font-heading text-2xl tracking-tight">
                  {stats.averageEtaMinutes} min
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                <p className="text-sm text-muted-foreground">Current spend</p>
                <p className="mt-2 font-heading text-2xl tracking-tight">
                  {formatCurrency(stats.monthlySpend.amountMinor, stats.monthlySpend.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SectionCard
          eyebrow="Quick Actions"
          title="Move directly into the live flow"
          description="Use the actions below to create a new delivery, follow the latest order or jump to the order summaries on this page."
        >
          <ClientOverviewActions
            latestOrderLabel={
              latestOrder ? `#${formatOrderId(latestOrder.id)}` : null
            }
            latestOrderHref={latestOrder ? `/client/orders/${latestOrder.id}` : null}
          />
        </SectionCard>
      </div>

      <ClientRuntimeStats
        activeCount={stats.activeOrdersCount}
        completedCount={stats.completedThisMonthCount}
        failedCount={stats.failedOrdersCount}
      />

      <section id="orders-overview" className="grid gap-5">
        <div className="grid gap-5">
          <section id="active-deliveries" className="scroll-mt-24">
            <SectionCard
              eyebrow="Active Deliveries"
              title="Orders currently moving through the city"
              description="The active summary stays short: what is happening now, how urgent it is and what the next visible state looks like."
            >
              <div className="grid gap-3">
                {activeOrders.slice(0, 3).map((order) => {
                  const progress = getOrderProgress(order);

                  return (
                    <div
                      key={order.id}
                      className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground">
                            Order #{formatOrderId(order.id)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDeliveryUrgency(order.urgency)} priority · {progress.label}
                          </p>
                        </div>
                        <StatusBadge
                          label={formatOrderStatus(order.status)}
                          tone={getOrderTone(order.status)}
                        />
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                          Dispatch window: {formatDateTime(order.scheduledFor)}
                        </div>
                        <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-3">
                          Progress: {progress.value}% through the current flow
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section id="completed-deliveries" className="scroll-mt-24">
            <SectionCard
              eyebrow="Completed Deliveries"
              title="Recent orders that closed cleanly"
              description="Completed deliveries show closure time and payment state, so the client can confirm the flow ended well."
            >
              <div className="grid gap-3">
                {completedOrders.slice(0, 3).map((order) => {
                  const payment = paymentByOrderId.get(order.id);

                  return (
                    <div
                      key={order.id}
                      className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-medium text-foreground">
                          Order #{formatOrderId(order.id)}
                        </h3>
                        <StatusBadge label="Delivered" tone="success" />
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        Completed on {formatDateTime(order.completedAt)} with{" "}
                        {formatDeliveryUrgency(order.urgency).toLowerCase()} urgency.
                      </p>
                      {payment ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <Wallet className="size-4 text-foreground" />
                          <span>
                            {formatCurrency(payment.amount.amountMinor, payment.amount.currency)}
                          </span>
                          <StatusBadge
                            label={paymentStatusLabels[payment.status]}
                            tone={getPaymentTone(payment.status)}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>

          <section id="failed-deliveries" className="scroll-mt-24">
            <SectionCard
              eyebrow="Failed Deliveries"
              title="Exceptions that still need visibility"
              description="Failures remain in the overview because they often lead to refund, retry or support follow-up, not because the product is unstable."
            >
              <div className="grid gap-3">
                {failedOrders.length > 0 ? (
                  failedOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-medium text-foreground">
                          Order #{formatOrderId(order.id)}
                        </h3>
                        <StatusBadge label="Needs review" tone="warning" />
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {order.cancellationReason}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <Route className="size-4 text-foreground" />
                        <span>Updated {formatDateTime(order.updatedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-7 text-muted-foreground">
                    No failed deliveries are currently visible in this overview.
                  </div>
                )}
              </div>
            </SectionCard>
          </section>
        </div>
      </section>

      <section id="recent-activity" className="scroll-mt-24">
        <SectionCard
          eyebrow="Recent Activity"
          title="The last important changes in one feed"
          description="Notifications and order updates are merged into one calm activity rail so the client can scan what changed without opening multiple widgets."
        >
          <div className="grid gap-3">
            {recentActivity.map((item) => (
              <div
                key={item.key}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.meta}</p>
                  </div>
                  <StatusBadge
                    label={formatDateTime(item.time)}
                    tone={item.tone}
                    dot={false}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </section>
  );
}
