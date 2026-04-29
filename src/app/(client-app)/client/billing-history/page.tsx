import { BillingHistoryView } from "@/components/billing/billing-history-view";
import { getBillingHistoryTransactions } from "@/lib/billing-history";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Billing History",
  "Review secure payment history and receipt actions for SkySend client deliveries.",
);

export default function ClientBillingHistoryPage() {
  const transactions = getBillingHistoryTransactions();

  return <BillingHistoryView transactions={transactions} />;
}
