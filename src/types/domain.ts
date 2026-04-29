export type OrderStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "in_flight"
  | "delivered"
  | "failed"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed";

export type DeliveryUrgency = "standard" | "priority" | "critical";

export type DroneClass =
  | "light_express"
  | "standard_courier"
  | "fragile_care"
  | "long_range"
  | "heavy_cargo";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "critical"
  | "system";
