import {
  getMockPaymentMethods,
  getMockPaymentRecords,
} from "@/lib/mock-data";
import type { BillingHistoryTransaction } from "@/types/billing-history";
import type { MoneyAmount } from "@/types/entities";

function formatCurrency(amount: MoneyAmount) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: 2,
  }).format(amount.amountMinor / 100);
}

export function getBillingHistoryTransactions(): BillingHistoryTransaction[] {
  const paymentMethods = getMockPaymentMethods();
  const methodById = new Map(paymentMethods.map((method) => [method.id, method]));

  return getMockPaymentRecords()
    .map((payment) => {
      const method = payment.paymentMethodId
        ? methodById.get(payment.paymentMethodId)
        : null;
      const paymentMethodLabel = method?.label ?? "Payment method pending";
      const paymentMethodDetail =
        method?.type === "card"
          ? `${method.brand ?? "Card"} ending in ${method.last4 ?? "0000"}`
          : method?.type === "invoice"
            ? "Monthly invoice settlement"
            : "No saved method";

      const normalizedStatus: BillingHistoryTransaction["status"] =
        payment.status === "authorized" ? "pending" : payment.status;

      return {
        id: payment.id,
        orderId: payment.orderId,
        date: payment.paidAt ?? payment.failedAt ?? payment.updatedAt,
        amountLabel: formatCurrency(payment.amount),
        paymentMethodLabel,
        paymentMethodDetail,
        status: normalizedStatus,
        receiptHref: `/client/orders/${payment.orderId}`,
      } satisfies BillingHistoryTransaction;
    })
    .sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}
