import type { DroneClass } from "@/types/domain";

export type AdminFleetAvailability =
  | "available"
  | "assigned"
  | "charging"
  | "maintenance"
  | "offline";

export type AdminFleetMaintenanceState =
  | "clear"
  | "routine_check"
  | "preflight_check"
  | "service_hold"
  | "offline_hold";

export type AdminFleetStatusItem = {
  id: DroneClass;
  name: string;
  description: string;
  availability: AdminFleetAvailability;
  availabilityLabel: string;
  batteryLabel: string;
  batteryPercent: number;
  activeTaskLabel: string | null;
  activeTaskDetail: string | null;
  maintenanceState: AdminFleetMaintenanceState;
  maintenanceLabel: string;
  recommendedUse: string;
  maxPayloadKg: number;
  estimatedRangeKm: number;
  estimatedSpeedKph: number;
};
