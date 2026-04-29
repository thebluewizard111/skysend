import {
  aggregateEcoMetricsByMonth,
  calculateEcoScore,
  formatEcoScore,
  formatEstimatedCo2Saved,
  formatRoadDistanceAvoided,
} from "@/lib/eco";
import { getMockEcoStats, getMockOrders } from "@/lib/mock-data";
import type { MonthlyEcoAggregate } from "@/types/eco-helpers";

export type ClientEcoDashboardSummary = {
  estimatedCo2SavedLabel: string;
  completedElectricDeliveriesLabel: string;
  roadDistanceAvoidedLabel: string;
  ecoScoreLabel: string;
  ecoScoreValue: number;
  ecoScoreDescription: string;
  estimatedMetricCount: number;
  measuredMetricCount: number;
  monthlyOverview: MonthlyEcoAggregate[];
  methodologyNote: string;
};

export function getClientEcoDashboardSummary(): ClientEcoDashboardSummary {
  const ecoStats = getMockEcoStats();
  const orders = getMockOrders();
  const completedOrderIds = new Set(
    orders
      .filter((order) => order.status === "delivered")
      .map((order) => order.id),
  );
  const completedElectricDeliveries = ecoStats.filter((metric) =>
    completedOrderIds.has(metric.orderId),
  );

  const totals = ecoStats.reduce(
    (current, metric) => ({
      estimatedCo2SavedGrams:
        current.estimatedCo2SavedGrams + metric.estimatedCo2SavedGrams,
      estimatedRoadDistanceSavedKm:
        current.estimatedRoadDistanceSavedKm +
        metric.estimatedRoadDistanceSavedKm,
      estimatedEnergyUseKwh:
        current.estimatedEnergyUseKwh + metric.estimatedEnergyUseKwh,
    }),
    {
      estimatedCo2SavedGrams: 0,
      estimatedRoadDistanceSavedKm: 0,
      estimatedEnergyUseKwh: 0,
    },
  );

  const ecoScore = calculateEcoScore({
    estimatedCo2SavedGrams: totals.estimatedCo2SavedGrams,
    estimatedRoadDistanceSavedKm: totals.estimatedRoadDistanceSavedKm,
    estimatedEnergyUseKwh: totals.estimatedEnergyUseKwh,
  });

  return {
    estimatedCo2SavedLabel: formatEstimatedCo2Saved(
      totals.estimatedCo2SavedGrams,
    ),
    completedElectricDeliveriesLabel: `${completedElectricDeliveries.length}`,
    roadDistanceAvoidedLabel: formatRoadDistanceAvoided(
      totals.estimatedRoadDistanceSavedKm,
    ),
    ecoScoreLabel: formatEcoScore(ecoScore),
    ecoScoreValue: ecoScore.score,
    ecoScoreDescription: ecoScore.label,
    estimatedMetricCount: ecoStats.filter((metric) => metric.status === "estimated")
      .length,
    measuredMetricCount: ecoStats.filter((metric) => metric.status === "measured")
      .length,
    monthlyOverview: aggregateEcoMetricsByMonth(ecoStats),
    methodologyNote:
      "Eco values are directional estimates based on saved road distance, conservative courier baselines and electric drone energy use. They are not verified emissions credits.",
  };
}
