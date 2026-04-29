import type { DeliveryUrgency, DroneClass } from "@/types/domain";
import type { CurrencyCode, MoneyAmount } from "@/types/entities";
import type { ParcelFragileLevel } from "@/types/parcel-assistant";

const currency: CurrencyCode = "RON";
const baseFeeMinor = 1290;
const distanceFeePerKmMinor = 275;
const fragileSurchargeMinor = 500;
const moderateFragileSurchargeMinor = 300;
const heavySurchargeMinor = 800;
const extraHeavySurchargeMinor = 1200;
const heavyThresholdKg = 3;
const extraHeavyThresholdKg = 5;

export type PricingBreakdownType =
  | "base_fee"
  | "distance_fee"
  | "urgency_adjustment"
  | "drone_class_adjustment"
  | "fragile_surcharge"
  | "heavy_surcharge";

export type PricingBreakdownItem = {
  type: PricingBreakdownType;
  label: string;
  amount: MoneyAmount;
};

export type PricingParcelInput = {
  estimatedWeightKg?: number | null;
  requiresFragileHandling?: boolean;
  fragileLevel?: ParcelFragileLevel | null;
};

export type CalculateMissionPricingInput = {
  distanceKm: number;
  urgency: DeliveryUrgency;
  droneClass: DroneClass;
  parcel?: PricingParcelInput | null;
};

export type MissionPricingResult = {
  currency: CurrencyCode;
  distanceKm: number;
  urgencyMultiplier: number;
  droneClassMultiplier: number;
  subtotal: MoneyAmount;
  total: MoneyAmount;
  breakdown: PricingBreakdownItem[];
};

export const urgencyPricingMultipliers: Record<DeliveryUrgency, number> = {
  standard: 1,
  priority: 1.25,
  critical: 1.55,
};

export const droneClassPricingMultipliers: Record<DroneClass, number> = {
  light_express: 1.08,
  standard_courier: 1,
  fragile_care: 1.14,
  long_range: 1.12,
  heavy_cargo: 1.22,
};

function money(amountMinor: number): MoneyAmount {
  return {
    amountMinor,
    currency,
  };
}

function roundMinor(value: number) {
  return Math.max(0, Math.round(value));
}

function roundDistance(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function getFragileSurcharge(parcel?: PricingParcelInput | null) {
  if (!parcel) {
    return 0;
  }

  if (parcel.requiresFragileHandling || parcel.fragileLevel === "high") {
    return fragileSurchargeMinor;
  }

  if (parcel.fragileLevel === "moderate") {
    return moderateFragileSurchargeMinor;
  }

  return 0;
}

function getHeavySurcharge(parcel?: PricingParcelInput | null) {
  const weightKg = parcel?.estimatedWeightKg;

  if (!weightKg || weightKg <= heavyThresholdKg) {
    return 0;
  }

  return weightKg > extraHeavyThresholdKg
    ? extraHeavySurchargeMinor
    : heavySurchargeMinor;
}

export function calculateMissionPricing({
  distanceKm,
  urgency,
  droneClass,
  parcel,
}: CalculateMissionPricingInput): MissionPricingResult {
  const billableDistanceKm = roundDistance(distanceKm);
  const distanceFeeMinor = roundMinor(
    billableDistanceKm * distanceFeePerKmMinor,
  );
  const baseSubtotalMinor = baseFeeMinor + distanceFeeMinor;
  const urgencyMultiplier = urgencyPricingMultipliers[urgency];
  const droneClassMultiplier = droneClassPricingMultipliers[droneClass];
  const urgencyAdjustmentMinor = roundMinor(
    baseSubtotalMinor * (urgencyMultiplier - 1),
  );
  const urgencyAdjustedSubtotalMinor =
    baseSubtotalMinor + urgencyAdjustmentMinor;
  const droneClassAdjustmentMinor = roundMinor(
    urgencyAdjustedSubtotalMinor * (droneClassMultiplier - 1),
  );
  const fragileMinor = getFragileSurcharge(parcel);
  const heavyMinor = getHeavySurcharge(parcel);
  const subtotalMinor =
    urgencyAdjustedSubtotalMinor + droneClassAdjustmentMinor;
  const totalMinor = subtotalMinor + fragileMinor + heavyMinor;
  const breakdown: PricingBreakdownItem[] = [
    {
      type: "base_fee",
      label: "Base fee",
      amount: money(baseFeeMinor),
    },
    {
      type: "distance_fee",
      label: "Distance fee",
      amount: money(distanceFeeMinor),
    },
  ];

  if (urgencyAdjustmentMinor > 0) {
    breakdown.push({
      type: "urgency_adjustment",
      label: "Urgency adjustment",
      amount: money(urgencyAdjustmentMinor),
    });
  }

  if (droneClassAdjustmentMinor > 0) {
    breakdown.push({
      type: "drone_class_adjustment",
      label: "Drone class adjustment",
      amount: money(droneClassAdjustmentMinor),
    });
  }

  if (fragileMinor > 0) {
    breakdown.push({
      type: "fragile_surcharge",
      label: "Fragile handling",
      amount: money(fragileMinor),
    });
  }

  if (heavyMinor > 0) {
    breakdown.push({
      type: "heavy_surcharge",
      label: "Heavy payload",
      amount: money(heavyMinor),
    });
  }

  return {
    currency,
    distanceKm: billableDistanceKm,
    urgencyMultiplier,
    droneClassMultiplier,
    subtotal: money(subtotalMinor),
    total: money(totalMinor),
    breakdown,
  };
}

