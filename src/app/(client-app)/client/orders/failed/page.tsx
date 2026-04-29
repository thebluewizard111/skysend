import Link from "next/link";
import { ArrowRight, LifeBuoy, RefreshCcw, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppButton } from "@/components/shared/app-button";
import { createPageMetadata } from "@/lib/metadata";
import { getClientFailedOrderSummaries } from "@/lib/client-orders";

export const metadata = createPageMetadata(
  "Failed orders",
  "Review failed client deliveries in Pitesti with clear reasons, fallback visibility and next-step actions.",
);

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ClientFailedOrdersPage() {
  const failedOrders = getClientFailedOrderSummaries();
  const paymentIssueCount = failedOrders.filter(
    (order) => order.paymentIssueLabel,
  ).length;

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Failed orders"
        title="Transparent delivery exceptions, with clear next steps."
        description="This page separates failed deliveries from the general order list so the client can understand what happened, what fallback was attempted and what action makes sense next."
        actions={[
          {
            label: "All orders",
            href: "/client/orders",
            variant: "outline",
          },
          {
            label: "Create delivery",
            href: "/client/create-delivery",
            variant: "default",
            icon: <ArrowRight className="size-4" />,
          },
        ]}
      />

      {failedOrders.length === 0 ? (
        <EmptyState
          title="No failed deliveries right now"
          description="The failed orders surface stays available for transparency, but the current client history does not include any unresolved failed missions."
          icon={<TriangleAlert className="size-6" />}
          primaryAction={{ label: "Back to orders", href: "/client/orders" }}
          secondaryAction={{ label: "Create delivery", href: "/client/create-delivery" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-[calc(var(--radius)+0.5rem)]">
              <CardContent className="grid gap-3 p-6">
                <p className="text-sm text-muted-foreground">Visible failed orders</p>
                <p className="font-heading text-3xl tracking-tight">
                  {failedOrders.length}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Each item stays visible here until the client decides the next step.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[calc(var(--radius)+0.5rem)]">
              <CardContent className="grid gap-3 p-6">
                <p className="text-sm text-muted-foreground">Fallback review</p>
                <p className="font-heading text-3xl tracking-tight">
                  {
                    failedOrders.filter((order) => order.fallbackUsed).length
                  }
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Orders where an alternate route or recovery check was attempted.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[calc(var(--radius)+0.5rem)]">
              <CardContent className="grid gap-3 p-6">
                <p className="text-sm text-muted-foreground">Payment issues</p>
                <p className="font-heading text-3xl tracking-tight">
                  {paymentIssueCount}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Failed orders can surface billing context without turning the page into a billing console.
                </p>
              </CardContent>
            </Card>
          </div>

          <SectionCard
            eyebrow="Review Queue"
            title="Failed orders with context and recovery options"
            description="The goal here is not to dramatize failure, but to explain it clearly and keep a useful action nearby."
          >
            <div className="grid gap-4">
              {failedOrders.map((order) => (
                <Card
                  key={order.id}
                  className="rounded-[calc(var(--radius)+0.5rem)] shadow-[var(--elevation-card)]"
                >
                  <CardContent className="grid gap-5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{order.id}</Badge>
                          <StatusBadge label="Failed" tone="warning" />
                          {order.paymentIssueLabel ? (
                            <StatusBadge label="Payment issue" tone="destructive" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Logged on {formatDateTime(order.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground">
                        Estimated cost:{" "}
                        <span className="font-medium text-foreground">
                          {order.estimatedCostLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                        <p className="text-sm text-muted-foreground">Route summary</p>
                        <p className="mt-2 text-sm leading-7 text-foreground">
                          {order.pickupArea} to {order.dropoffArea}
                        </p>
                      </div>

                      <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                        <p className="text-sm text-muted-foreground">Fallback</p>
                        <div className="mt-2">
                          <StatusBadge
                            label={order.fallbackLabel}
                            tone={order.fallbackUsed ? "info" : "neutral"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                      <p className="text-sm text-muted-foreground">Failure reason</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {order.failureReason}
                      </p>
                    </div>

                    {order.paymentIssueLabel ? (
                      <div className="rounded-[calc(var(--radius)+0.375rem)] border border-destructive/20 bg-destructive/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          Payment issue
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {order.paymentIssueLabel}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <AppButton asChild>
                        <Link href="/client/create-delivery">
                          <RefreshCcw className="size-4" />
                          Retry Delivery
                        </Link>
                      </AppButton>
                      <AppButton asChild variant="outline">
                        <Link href={order.href}>View Details</Link>
                      </AppButton>
                      <AppButton asChild variant="ghost">
                        <Link href="/contact">
                          <LifeBuoy className="size-4" />
                          Contact Support
                        </Link>
                      </AppButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </section>
  );
}
