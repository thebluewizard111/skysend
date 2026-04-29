import { ArrowLeft, Package2, ShieldCheck } from "lucide-react";
import { AdminOrdersManagementView } from "@/components/admin/admin-orders-management-view";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminOrderManagementRows } from "@/lib/admin-orders";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Admin Orders Management",
  "Administrative order management for SkySend operations in Pitesti.",
);

type PageProps = {
  searchParams?: Promise<{
    review?: string;
  }>;
};

function getInitialReviewFilter(value?: string) {
  return value === "needs_review" ||
    value === "resolved" ||
    value === "clear"
    ? value
    : "all";
}

export default async function AdminOrdersManagementPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams;
  const orders = getAdminOrderManagementRows();
  const initialReviewFilter = getInitialReviewFilter(
    resolvedSearchParams?.review,
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="app-container">
        <PageHeader
          eyebrow="Admin Orders"
          title="Orders management for the Pitesti operating window."
          description="Search, filter and review every order from one administrative surface prepared for a future Supabase-backed order table."
          actions={[
            {
              label: "Back to Admin",
              href: "/admin",
              variant: "ghost",
              icon: <ArrowLeft className="size-4" />,
            },
            {
              label: "Needs Review",
              href: "/admin/manual-review",
              variant: "outline",
              icon: <ShieldCheck className="size-4" />,
            },
            {
              label: "All Orders",
              href: "/admin/orders",
              variant: "default",
              icon: <Package2 className="size-4" />,
            },
          ]}
        />
      </div>

      <AdminOrdersManagementView
        orders={orders}
        initialReviewFilter={initialReviewFilter}
      />
    </section>
  );
}
