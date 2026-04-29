import { StatusBadge } from "@/components/shared/status-badge";
import { serviceAreaConfig } from "@/constants/service-area";
import { getServiceAreaMapOverlay } from "@/lib/map";
import { LazyMapContainer } from "@/components/maps/lazy-map-container";

const serviceAreaOverlay = getServiceAreaMapOverlay();
const serviceAreaOverlays = [serviceAreaOverlay] as const;

export function ServiceAreaMap() {
  return (
    <LazyMapContainer
      ariaLabel="SkySend coverage map"
      center={serviceAreaConfig.center}
      zoom={12.8}
      markers={[
        {
          id: "pitesti-core",
          point: serviceAreaConfig.center,
          label: "Pitesti active hub",
          tone: "primary",
          emphasized: true,
        },
      ]}
      overlays={serviceAreaOverlays}
      overlayContent={
        <div className="map-overlay-card max-w-xs">
          <p className="type-caption">Active coverage</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label="Pitesti only" tone="success" />
            <StatusBadge
              label={`${serviceAreaConfig.coverageRadiusKm} km radius`}
              tone="info"
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Current launch coverage is centered on municipal Pitesti. The same
            component is ready for future polygon-based city boundaries.
          </p>
        </div>
      }
    />
  );
}
