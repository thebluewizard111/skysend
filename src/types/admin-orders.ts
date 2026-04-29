import type { DeliveryUrgency, DroneClass, OrderStatus, PaymentStatus } from "@/types/domain";

export type AdminOrderReviewStatus = "clear" | "needs_review" | "resolved";

export type AdminOrderManagementRow = {
  id: string;
  clientName: string;
  clientCompany: string | null;
  pickupSummary: string;
  dropoffSummary: string;
  status: OrderStatus;
  urgency: DeliveryUrgency;
  paymentStatus: PaymentStatus | "missing";
  paymentStatusLabel: string;
  assignedDroneClass: DroneClass | null;
  assignedDroneClassLabel: string;
  createdAt: string;
  scheduledFor: string | null;
  reviewStatus: AdminOrderReviewStatus;
  reviewReason: string;
};
