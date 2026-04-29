"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { readCreatedDeliveryOrders } from "@/lib/create-delivery-submit";

type ClientRuntimeStatsProps = {
  activeCount: number;
  completedCount: number;
  failedCount: number;
};

export function ClientRuntimeStats({
  activeCount,
  completedCount,
  failedCount,
}: ClientRuntimeStatsProps) {
  const [runtimeCounts, setRuntimeCounts] = useState({
    active: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const runtimeOrders = readCreatedDeliveryOrders();
      setRuntimeCounts({
        active: runtimeOrders.filter(
          (order) =>
            order.paymentStatus === "paid" &&
            (order.fulfillmentStatus === "active_mission" ||
              order.fulfillmentStatus === "order_created"),
        ).length,
        failed: runtimeOrders.filter(
          (order) =>
            order.fulfillmentStatus === "failed_mission" ||
            order.fulfillmentStatus === "fallback_required",
        ).length,
        completed: runtimeOrders.filter(
          (order) => order.fulfillmentStatus === "completed_mission",
        ).length,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Active deliveries"
        value={`${activeCount + runtimeCounts.active}`}
        hint="Queued, scheduled and in-flight deliveries currently visible in Pitesti."
        trend={<StatusBadge label="Live now" tone="info" />}
      />
      <StatCard
        label="Completed deliveries"
        value={`${completedCount + runtimeCounts.completed}`}
        hint="Orders closed successfully in the current monthly reporting window."
        trend={<StatusBadge label="Updated" tone="success" />}
      />
      <StatCard
        label="Failed deliveries"
        value={`${failedCount + runtimeCounts.failed}`}
        hint="Exceptions that still matter because retry, refund or follow-up may be needed."
        trend={<StatusBadge label="Needs review" tone="warning" />}
      />
    </div>
  );
}
