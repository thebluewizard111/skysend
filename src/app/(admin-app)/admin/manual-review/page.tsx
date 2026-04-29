import { ArrowLeft, Package2 } from "lucide-react";
import { ManualReviewQueueView } from "@/components/admin/manual-review-queue-view";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminManualReviewItems } from "@/lib/admin-manual-review";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Manual Review Queue",
  "Admin manual review queue for SkySend delivery exceptions in Pitesti.",
);

export default function AdminManualReviewQueuePage() {
  const items = getAdminManualReviewItems();

  return (
    <section className="flex flex-col gap-6">
      <div className="app-container">
        <PageHeader
          eyebrow="Manual Review"
          title="Queue for delivery decisions that need human judgment."
          description="Address confidence, handoff point clarity, parcel mismatch, payment issues, safety flags and missing candidate points are handled calmly before dispatch or closure."
          actions={[
            {
              label: "Back to Admin",
              href: "/admin",
              variant: "ghost",
              icon: <ArrowLeft className="size-4" />,
            },
            {
              label: "Orders Management",
              href: "/admin/orders",
              variant: "outline",
              icon: <Package2 className="size-4" />,
            },
          ]}
        />
      </div>

      <ManualReviewQueueView items={items} />
    </section>
  );
}
