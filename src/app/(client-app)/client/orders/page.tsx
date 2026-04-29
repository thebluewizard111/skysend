import { ClientOrdersView } from "@/components/dashboard/client-orders-view";
import { createPageMetadata } from "@/lib/metadata";
import { getClientOrderSummaries } from "@/lib/client-orders";

export const metadata = createPageMetadata(
  "Client Orders",
  "Review, search and filter client delivery orders in the active Pitesti service area.",
);

export default function ClientOrdersPage() {
  const orders = getClientOrderSummaries();

  return <ClientOrdersView orders={orders} />;
}
