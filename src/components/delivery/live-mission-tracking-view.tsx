"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileCheck2,
  Package2,
  Route,
} from "lucide-react";
import { LiveMissionMap } from "@/components/mission/live-mission-map";
import { LockerSimulation } from "@/components/mission/locker-simulation";
import { MissionActionPanel } from "@/components/mission/mission-action-panel";
import { MissionControlBar } from "@/components/mission/mission-control-bar";
import { MissionEventLog } from "@/components/mission/mission-event-log";
import { MissionTimeline } from "@/components/mission/mission-timeline";
import { MissionBrief } from "@/components/mission/mission-brief";
import { PayloadVerification } from "@/components/mission/payload-verification";
import {
  isProofOfDeliveryReady,
  ProofOfDelivery,
} from "@/components/mission/proof-of-delivery";
import { RecipientTrackingLinkCard } from "@/components/recipient/recipient-tracking-link-card";
import { SafetyChecklist } from "@/components/mission/safety-checklist";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { updateCreatedDeliveryOrderFulfillment } from "@/lib/create-delivery-submit";
import type {
  CreatedDeliveryOrder,
  CreatedDeliveryPaymentStatus,
} from "@/types/create-delivery";

type LiveMissionTrackingViewProps = {
  order: CreatedDeliveryOrder;
  statusLabel: string;
  urgencyLabel: string;
  priceLabel: string;
  etaLabel: string;
  paymentLabel: string;
  parcelSummary: string;
  droneSummary: string;
  outcomeSummary?: string | null;
  startOnMount?: boolean;
  paymentStatus?: CreatedDeliveryPaymentStatus;
  checkoutHref?: string;
};

const paymentStatusLabels: Record<CreatedDeliveryPaymentStatus, string> = {
  unpaid: "Unpaid",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

function getPaymentTone(status: CreatedDeliveryPaymentStatus) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "failed":
    case "refunded":
      return "destructive" as const;
    case "processing":
      return "info" as const;
    default:
      return "warning" as const;
  }
}

function getPaymentGateCopy(status: CreatedDeliveryPaymentStatus) {
  switch (status) {
    case "processing":
      return {
        title: "Payment is processing",
        description:
          "SkySend is waiting for card payment confirmation before dispatch.",
        action: "Complete payment",
      };
    case "failed":
      return {
        title: "Payment failed",
        description:
          "The mission has not started. Retry payment to unlock dispatch.",
        action: "Retry payment",
      };
    case "refunded":
      return {
        title: "Payment refunded",
        description:
          "Dispatch is blocked because the payment has been refunded.",
        action: "Review payment",
      };
    default:
      return {
        title: "Payment required before dispatch",
        description:
          "Complete card payment before SkySend creates and starts the live mission.",
        action: "Complete payment",
      };
  }
}

export function LiveMissionTrackingView({
  order,
  statusLabel,
  urgencyLabel,
  priceLabel,
  etaLabel,
  paymentLabel,
  parcelSummary,
  droneSummary,
  outcomeSummary,
  startOnMount = true,
  paymentStatus = "paid",
  checkoutHref,
}: LiveMissionTrackingViewProps) {
  const searchParams = useSearchParams();
  const [shouldShowMissionBrief, setShouldShowMissionBrief] = useState(
    () => searchParams.get("brief") === "1",
  );
  const {
    currentMission,
    currentStatus,
    isMissionRunning,
    createMissionFromOrder,
    startMission,
  } = useMissionRuntime();
  const recipientMissionId =
    currentMission?.sourceOrderId === order.id ? currentMission.id : null;
  const isPaymentPaid = paymentStatus === "paid";
  const effectiveCheckoutHref = checkoutHref ?? `/client/checkout/${order.id}`;
  const shouldShowProof =
    currentMission?.sourceOrderId === order.id &&
    isProofOfDeliveryReady(currentStatus);

  useEffect(() => {
    if (!isPaymentPaid) {
      return;
    }

    if (currentMission?.sourceOrderId === order.id) {
      if (
        startOnMount &&
        !shouldShowMissionBrief &&
        !isMissionRunning &&
        currentStatus !== "mission_closed"
      ) {
        startMission();
      }

      return;
    }

    createMissionFromOrder(order);

    if (startOnMount && !shouldShowMissionBrief) {
      window.requestAnimationFrame(() => {
        startMission();
      });
    }
  }, [
    createMissionFromOrder,
    currentMission?.sourceOrderId,
    currentStatus,
    isPaymentPaid,
    isMissionRunning,
    order,
    shouldShowMissionBrief,
    startMission,
    startOnMount,
  ]);

  useEffect(() => {
    if (!isPaymentPaid || !startOnMount || !shouldShowMissionBrief) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShouldShowMissionBrief(false);
      startMission();
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [isPaymentPaid, shouldShowMissionBrief, startMission, startOnMount]);

  useEffect(() => {
    if (
      !isPaymentPaid ||
      !currentMission ||
      currentMission.sourceOrderId !== order.id
    ) {
      return;
    }

    if (isProofOfDeliveryReady(currentStatus)) {
      updateCreatedDeliveryOrderFulfillment({
        orderId: order.id,
        fulfillmentStatus: "completed_mission",
        missionId: currentMission.id,
        missionStatus: currentStatus,
        completedAt:
          currentMission.closedAt ??
          currentMission.completedAt ??
          currentMission.updatedAt,
      });
      return;
    }

    if (currentStatus === "mission_failed") {
      updateCreatedDeliveryOrderFulfillment({
        orderId: order.id,
        fulfillmentStatus: "failed_mission",
        missionId: currentMission.id,
        missionStatus: currentStatus,
      });
      return;
    }

    if (currentStatus === "fallback_required") {
      updateCreatedDeliveryOrderFulfillment({
        orderId: order.id,
        fulfillmentStatus: "fallback_required",
        missionId: currentMission.id,
        missionStatus: currentStatus,
      });
      return;
    }

    updateCreatedDeliveryOrderFulfillment({
      orderId: order.id,
      fulfillmentStatus: "active_mission",
      missionId: currentMission.id,
      missionStatus: currentStatus,
    });
  }, [currentMission, currentStatus, isPaymentPaid, order.id]);

  if (!isPaymentPaid) {
    const paymentCopy = getPaymentGateCopy(paymentStatus);

    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Order Tracking"
          title={order.id}
          description="Mission dispatch is locked until payment is confirmed."
          actions={[
            {
              label: "Back to Orders",
              href: "/client/orders",
              variant: "ghost",
              icon: <ArrowLeft className="size-4" />,
            },
          ]}
        />

        <SectionCard
          eyebrow="Payment"
          title={paymentCopy.title}
          description={paymentCopy.description}
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
              <div>
                <p className="font-medium text-foreground">Payment status</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {paymentLabel}. DeliveryOrder exists, but Mission Runtime is
                  not created until payment is paid.
                </p>
              </div>
              <StatusBadge
                label={paymentStatusLabels[paymentStatus]}
                tone={getPaymentTone(paymentStatus)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-5">
                <div className="flex items-center gap-3">
                  <Package2 className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Parcel</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {parcelSummary}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-5">
                <div className="flex items-center gap-3">
                  <Route className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Route</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {order.payload.pickupAddress.formattedAddress}
                  <br />
                  {order.payload.dropoffAddress.formattedAddress}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton asChild size="lg" className="w-full sm:w-fit">
                <Link href={effectiveCheckoutHref}>
                  <CreditCard className="size-4" />
                  {paymentCopy.action}
                </Link>
              </AppButton>
              <AppButton asChild variant="outline" size="lg" className="w-full sm:w-fit">
                <Link href="/client/orders">Back to orders</Link>
              </AppButton>
            </div>
          </div>
        </SectionCard>
      </section>
    );
  }

  if (shouldShowMissionBrief && currentMission?.sourceOrderId === order.id) {
    return <MissionBrief mission={currentMission} etaLabel={etaLabel} />;
  }

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Live Mission"
        title={order.id}
        description="Follow the active SkySend mission from the Pitesti hub through pickup, flight, recipient handoff and final proof."
        actions={[
          {
            label: "Back to Orders",
            href: "/client/orders",
            variant: "ghost",
            icon: <ArrowLeft className="size-4" />,
          },
        ]}
      />

      <MissionControlBar
        orderId={order.id}
        pickupLabel={order.payload.selectedPickupPoint.label}
        dropoffLabel={order.payload.selectedDropoffPoint.label}
        statusLabel={statusLabel}
        urgencyLabel={urgencyLabel}
        etaLabel={etaLabel}
        priceLabel={priceLabel}
        droneClassLabel={droneSummary}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={`Payment ${paymentStatusLabels[paymentStatus]}`}
          tone={getPaymentTone(paymentStatus)}
        />
        <StatusBadge label="Mission dispatch unlocked" tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <LiveMissionMap
          fallbackPickup={{
            label: order.payload.selectedPickupPoint.label,
            point: order.payload.selectedPickupPoint.location,
          }}
          fallbackDropoff={{
            label: order.payload.selectedDropoffPoint.label,
            point: order.payload.selectedDropoffPoint.location,
          }}
        />

        <div className="grid gap-5">
          <MissionActionPanel />
          <PayloadVerification
            orderId={order.id}
            parcel={order.payload.parcel}
            droneClass={order.payload.recommendedDroneClass}
          />
          <SafetyChecklist />
          <LockerSimulation />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <MissionTimeline />
        <MissionEventLog />
      </div>

      {shouldShowProof && currentMission ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <ProofOfDelivery
            mission={currentMission}
            orderId={order.id}
              paymentStatus={paymentStatus}
              paymentLabel={paymentLabel}
              finalPriceLabel={priceLabel}
            />
          <MissionEventLog />
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          eyebrow="Summary"
          title="Delivery summary"
          description="Compact order context remains available while the live mission is running."
        >
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
              <div className="flex items-center gap-3">
                <Package2 className="size-4 text-foreground" />
                <p className="font-medium text-foreground">Parcel</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {parcelSummary}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
              <div className="flex items-center gap-3">
                <Route className="size-4 text-foreground" />
                <p className="font-medium text-foreground">Route</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {order.payload.pickupAddress.formattedAddress}
                <br />
                {order.payload.dropoffAddress.formattedAddress}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
              <p className="font-medium text-foreground">Drone</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {droneSummary}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
              <p className="font-medium text-foreground">Payment</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {paymentLabel}
                </p>
              </div>
            </div>

          <RecipientTrackingLinkCard
            orderId={order.id}
            missionId={recipientMissionId}
            compact
          />
        </SectionCard>

        <SectionCard
          eyebrow="Proof"
          title="Proof of delivery"
          description="Final proof will combine PIN verification, locker state, event log and telemetry."
        >
          <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-4 text-foreground" />
              <p className="font-medium text-foreground">
                {currentStatus === "mission_closed" ? "Proof ready" : "Proof pending"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {outcomeSummary ??
                "Proof will be available after recipient collection and mission closeout."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge label="PIN records" tone="neutral" />
              <StatusBadge label="Locker state" tone="neutral" />
              <StatusBadge label="Telemetry" tone="neutral" />
              <StatusBadge label="Event log" tone="neutral" />
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
