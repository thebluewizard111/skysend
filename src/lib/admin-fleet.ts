import { deliveryUrgencyLabels, orderStatusLabels } from "@/constants/domain";
import { getMockDroneClasses, getMockOrders } from "@/lib/mock-data";
import { sortOrdersByDate } from "@/lib/orders";
import type {
  AdminFleetAvailability,
  AdminFleetMaintenanceState,
  AdminFleetStatusItem,
} from "@/types/admin-fleet";
import type { DroneClass } from "@/types/domain";
import type { DeliveryOrder } from "@/types/entities";

type FleetMockState = {
  availability: AdminFleetAvailability;
  batteryPercent: number;
  maintenanceState: AdminFleetMaintenanceState;
  maintenanceLabel: string;
};

const fleetMockState: Record<DroneClass, FleetMockState> = {
  light_express: {
    availability: "charging",
    batteryPercent: 62,
    maintenanceState: "preflight_check",
    maintenanceLabel: "Charging before next compact dispatch",
  },
  standard_courier: {
    availability: "assigned",
    batteryPercent: 78,
    maintenanceState: "clear",
    maintenanceLabel: "Clear for active Pitesti mission",
  },
  fragile_care: {
    availability: "available",
    batteryPercent: 91,
    maintenanceState: "routine_check",
    maintenanceLabel: "Ready, with sensor calibration checked this morning",
  },
  long_range: {
    availability: "offline",
    batteryPercent: 34,
    maintenanceState: "offline_hold",
    maintenanceLabel: "Offline for telemetry inspection",
  },
  heavy_cargo: {
    availability: "maintenance",
    batteryPercent: 48,
    maintenanceState: "service_hold",
    maintenanceLabel: "Payload frame check before heavy dispatch",
  },
};

const availabilityLabels: Record<AdminFleetAvailability, string> = {
  available: "Available",
  assigned: "Assigned",
  charging: "Charging",
  maintenance: "Maintenance",
  offline: "Offline",
};

function formatOrderId(orderId: string) {
  return orderId.split("_").at(-1)?.replace(/^0+/, "") || orderId;
}

function getActiveTask(
  droneClassId: DroneClass,
  activeOrders: DeliveryOrder[],
) {
  return activeOrders.find(
    (order) => order.assignedDroneClassId === droneClassId,
  );
}

export function getAdminFleetStatusItems(): AdminFleetStatusItem[] {
  const droneClasses = getMockDroneClasses();
  const activeOrders = sortOrdersByDate(
    getMockOrders().filter((order) =>
      ["queued", "scheduled", "in_flight"].includes(order.status),
    ),
    "scheduledFor",
    "asc",
  );

  return droneClasses.map((droneClass) => {
    const state = fleetMockState[droneClass.id];
    const activeTask = getActiveTask(droneClass.id, activeOrders);

    return {
      id: droneClass.id,
      name: droneClass.config.name,
      description: droneClass.config.shortDescription,
      availability: state.availability,
      availabilityLabel: availabilityLabels[state.availability],
      batteryLabel: `${state.batteryPercent}% battery`,
      batteryPercent: state.batteryPercent,
      activeTaskLabel: activeTask
        ? `Order #${formatOrderId(activeTask.id)}`
        : null,
      activeTaskDetail: activeTask
        ? `${orderStatusLabels[activeTask.status]} / ${
            deliveryUrgencyLabels[activeTask.urgency]
          } urgency`
        : null,
      maintenanceState: state.maintenanceState,
      maintenanceLabel: state.maintenanceLabel,
      recommendedUse: droneClass.config.recommendedUseCases[0],
      maxPayloadKg: droneClass.config.maxPayloadKg,
      estimatedRangeKm: droneClass.config.estimatedRangeKm,
      estimatedSpeedKph: droneClass.config.estimatedSpeedKph,
    };
  });
}
