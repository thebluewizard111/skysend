import { LazyMapContainer } from "@/components/maps/lazy-map-container";
import { StatusBadge } from "@/components/shared/status-badge";
import type { GeoPoint } from "@/types/service-area";

function getMapCenter(pickup: GeoPoint, dropoff: GeoPoint): GeoPoint {
  return {
    latitude: (pickup.latitude + dropoff.latitude) / 2,
    longitude: (pickup.longitude + dropoff.longitude) / 2,
  };
}

export function OrderRouteMapPreview({
  pickup,
  dropoff,
}: {
  pickup: GeoPoint;
  dropoff: GeoPoint;
}) {
  return (
    <LazyMapContainer
      className="min-h-[20rem]"
      ariaLabel="Order route preview"
      center={getMapCenter(pickup, dropoff)}
      zoom={13.2}
      interactive={false}
      markers={[
        {
          id: "pickup",
          point: pickup,
          label: "Pickup point",
          tone: "primary",
          emphasized: true,
        },
        {
          id: "dropoff",
          point: dropoff,
          label: "Drop-off point",
          tone: "success",
          emphasized: true,
        },
      ]}
      overlayContent={
        <div className="map-overlay-card max-w-sm">
          <p className="type-caption">Route preview</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label="Pickup visible" tone="info" />
            <StatusBadge label="Drop-off visible" tone="success" />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The route stays inside the active Pitesti service area and keeps both
            delivery points visible in one restrained map surface.
          </p>
        </div>
      }
    />
  );
}
