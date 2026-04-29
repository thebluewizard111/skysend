import {
  BellOff,
  CreditCard,
  PackageSearch,
  ShieldAlert,
  WalletMinimal,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function OrdersEmptyState() {
  return (
    <EmptyState
      title="No orders yet"
      description="Delivery requests will appear here once a client creates the first order. This view is meant to stay calm even when the workspace is still empty."
      icon={<PackageSearch className="size-6" />}
      primaryAction={{ label: "Create Order", href: "/client/create-delivery" }}
      secondaryAction={{ label: "Review Coverage", href: "/coverage" }}
    />
  );
}

export function FailedOrdersEmptyState() {
  return (
    <EmptyState
      title="No failed orders in this period"
      description="Operational exceptions and blocked deliveries will show up here when something requires review. An empty queue is the expected healthy state."
      icon={<ShieldAlert className="size-6" />}
      primaryAction={{ label: "Back to Overview", href: "/operator" }}
    />
  );
}

export function NotificationsEmptyState() {
  return (
    <EmptyState
      title="No notifications right now"
      description="Alerts, delivery milestones and account updates will surface here when they matter. Until then, the workspace stays intentionally quiet."
      icon={<BellOff className="size-6" />}
      primaryAction={{ label: "Go to Dashboard", href: "/client" }}
    />
  );
}

export function PaymentsEmptyState() {
  return (
    <EmptyState
      title="No payment activity yet"
      description="Invoices, saved methods and transaction history will appear here after the first paid delivery. The empty state should feel reassuring, not unfinished."
      icon={<CreditCard className="size-6" />}
      primaryAction={{ label: "View Pricing", href: "/pricing" }}
      secondaryAction={{ label: "Contact Sales", href: "/contact" }}
    />
  );
}

export function PaymentMethodsEmptyState() {
  return (
    <EmptyState
      title="No payment methods saved"
      description="Add a payment method when the billing flow is enabled. Until then, this surface remains clean and intentionally minimal."
      icon={<WalletMinimal className="size-6" />}
      primaryAction={{ label: "Open Billing", href: "/client" }}
    />
  );
}
