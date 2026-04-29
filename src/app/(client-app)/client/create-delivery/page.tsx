import { CreateDeliveryShell } from "@/components/delivery/create-delivery-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Create delivery",
  "Start a new SkySend delivery inside the active Pitesti service area with route, parcel, urgency, map preview and summary in one flow.",
);

export default function CreateDeliveryPage() {
  return <CreateDeliveryShell />;
}
