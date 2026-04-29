import { PaymentMethodsView } from "@/components/billing/payment-methods-view";
import { getClientSavedTestCards } from "@/lib/client-payment-methods";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Payment Methods",
  "Manage saved card payment methods for the SkySend client dashboard.",
);

export default function ClientPaymentMethodsPage() {
  const cards = getClientSavedTestCards();

  return <PaymentMethodsView initialCards={cards} />;
}
