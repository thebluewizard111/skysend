import { LazyMapContainer } from "@/components/maps/lazy-map-container";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { coveragePreviewMarkers, coveragePreviewStats } from "@/constants/coverage-map";
import { serviceAreaConfig } from "@/constants/service-area";
import { getServiceAreaMapOverlay } from "@/lib/map";
import { cn } from "@/lib/utils";

type CoverageMapPreviewProps = {
  className?: string;
};

const serviceAreaOverlay = getServiceAreaMapOverlay();
const serviceAreaOverlays = [serviceAreaOverlay] as const;

export function CoverageMapPreview({
  className,
}: CoverageMapPreviewProps) {
  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]", className)}>
      <LazyMapContainer
        className="min-h-[25rem]"
        ariaLabel="SkySend coverage preview"
        center={serviceAreaConfig.center}
        zoom={12.6}
        markers={coveragePreviewMarkers}
        overlays={serviceAreaOverlays}
        overlayContent={
          <div className="map-overlay-card max-w-sm">
            <p className="type-caption">Coverage preview</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label="Pitesti active" tone="success" />
              <StatusBadge label="Service points shown" tone="info" />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The current live zone is centered on Pitesti, with visible
              dispatch points and a clearly bounded service area.
            </p>
          </div>
        }
      />

      <div className="grid gap-5">
        <Card size="sm" className="rounded-[var(--ui-radius-panel)]">
          <CardHeader className="gap-3">
            <StatusBadge label="Coverage signals" tone="info" />
            <CardTitle className="max-w-sm text-2xl">
              Clear network context without map clutter.
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "The central hub anchors the current Pitesti delivery zone.",
              "Service points show where dispatch and handoff activity is already concentrated.",
              "The overlay stays restrained so the map remains readable on mobile and desktop.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/55 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {coveragePreviewStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
