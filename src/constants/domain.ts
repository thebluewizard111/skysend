import type {
  DeliveryUrgency,
  DroneClass,
  NotificationType,
  OrderStatus,
  PaymentStatus,
} from "@/types/domain";
import type { UserRole } from "@/types/roles";
import type { Option } from "@/types/ui";

export const userRoleLabels: Record<UserRole, string> = {
  client: "Client",
  admin: "Admin",
  operator: "Operator",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  queued: "Queued",
  in_flight: "In Flight",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export const deliveryUrgencyLabels: Record<DeliveryUrgency, string> = {
  standard: "Standard",
  priority: "Priority",
  critical: "Critical",
};

export const droneClassLabels: Record<DroneClass, string> = {
  light_express: "Light Express",
  standard_courier: "Standard Courier",
  fragile_care: "Fragile Care",
  long_range: "Long Range",
  heavy_cargo: "Heavy Cargo",
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  critical: "Critical",
  system: "System",
};

export const userRoleOptions: Option<UserRole>[] = [
  { label: userRoleLabels.client, value: "client" },
  { label: userRoleLabels.admin, value: "admin" },
  { label: userRoleLabels.operator, value: "operator" },
];

export const orderStatusOptions: Option<OrderStatus>[] = [
  { label: orderStatusLabels.draft, value: "draft" },
  { label: orderStatusLabels.scheduled, value: "scheduled" },
  { label: orderStatusLabels.queued, value: "queued" },
  { label: orderStatusLabels.in_flight, value: "in_flight" },
  { label: orderStatusLabels.delivered, value: "delivered" },
  { label: orderStatusLabels.failed, value: "failed" },
  { label: orderStatusLabels.cancelled, value: "cancelled" },
  { label: orderStatusLabels.returned, value: "returned" },
];

export const paymentStatusOptions: Option<PaymentStatus>[] = [
  { label: paymentStatusLabels.pending, value: "pending" },
  { label: paymentStatusLabels.authorized, value: "authorized" },
  { label: paymentStatusLabels.paid, value: "paid" },
  { label: paymentStatusLabels.refunded, value: "refunded" },
  { label: paymentStatusLabels.failed, value: "failed" },
];

export const deliveryUrgencyOptions: Option<DeliveryUrgency>[] = [
  { label: deliveryUrgencyLabels.standard, value: "standard" },
  { label: deliveryUrgencyLabels.priority, value: "priority" },
  { label: deliveryUrgencyLabels.critical, value: "critical" },
];

export const droneClassOptions: Option<DroneClass>[] = [
  { label: droneClassLabels.light_express, value: "light_express" },
  { label: droneClassLabels.standard_courier, value: "standard_courier" },
  { label: droneClassLabels.fragile_care, value: "fragile_care" },
  { label: droneClassLabels.long_range, value: "long_range" },
  { label: droneClassLabels.heavy_cargo, value: "heavy_cargo" },
];

export const notificationTypeOptions: Option<NotificationType>[] = [
  { label: notificationTypeLabels.info, value: "info" },
  { label: notificationTypeLabels.success, value: "success" },
  { label: notificationTypeLabels.warning, value: "warning" },
  { label: notificationTypeLabels.critical, value: "critical" },
  { label: notificationTypeLabels.system, value: "system" },
];
