"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  MapPin,
} from "lucide-react";
import { LazyMapContainer } from "@/components/maps/lazy-map-container";
import { RecipientActionPanel } from "@/components/recipient/recipient-action-panel";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  missionStatusDescriptions,
  missionStatusLabels,
} from "@/constants/mission";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { getMarkerDrivenViewport, getServiceAreaMapOverlay } from "@/lib/map";
import { doesRecipientTokenMatchMission } from "@/lib/recipient-tracking";
import type { MapLineDefinition, MapMarkerDefinition } from "@/types/map";
import type { GeoPoint } from "@/types/service-area";
import type {
  DroneTelemetry,
  Mission,
  MissionSegment,
  MissionStatus,
} from "@/types/mission";

type RecipientMissionTrackingViewProps = {
  missionId: string;
};

const dropoffReachedStatuses: MissionStatus[] = [
  "arrived_at_dropoff",
  "awaiting_recipient_position_confirmation",
  "awaiting_recipient_pin",
  "dropoff_safety_check",
  "locker_descending_dropoff",
  "awaiting_parcel_collection",
  "locker_ascending_dropoff",
  "delivery_completed",
  "proof_generated",
  "mission_closed",
];

const serviceAreaOverlays = [getServiceAreaMapOverlay()] as const;

function createLineData(points: GeoPoint[]): MapLineDefinition["data"] {
  if (points.length < 2) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: points.map((point) => [
            point.longitude,
            point.latitude,
          ]),
        },
      },
    ],
  };
}

function getRemainingDropoffSeconds({
  currentStatus,
  activeSegment,
  segmentProgress,
  missionSegments,
}: {
  currentStatus: MissionStatus | null;
  activeSegment: MissionSegment | null;
  segmentProgress: number;
  missionSegments: MissionSegment[];
}) {
  if (!currentStatus) {
    return null;
  }

  if (currentStatus === "mission_closed" || currentStatus === "delivery_completed") {
    return 0;
  }

  if (dropoffReachedStatuses.includes(currentStatus)) {
    return 0;
  }

  if (activeSegment?.type === "pickup_to_dropoff") {
    return Math.max(
      0,
      Math.round((activeSegment.plannedDurationSeconds ?? 35) * (1 - segmentProgress)),
    );
  }

  const dropoffSegment = missionSegments.find(
    (segment) => segment.type === "pickup_to_dropoff",
  );
  const pickupSegment = missionSegments.find(
    (segment) => segment.type === "warehouse_to_pickup",
  );
  const pickupRemainder =
    activeSegment?.type === "warehouse_to_pickup"
      ? Math.round((activeSegment.plannedDurationSeconds ?? 30) * (1 - segmentProgress))
      : pickupSegment?.state === "completed"
        ? 0
        : pickupSegment?.plannedDurationSeconds ?? 30;

  return pickupRemainder + (dropoffSegment?.plannedDurationSeconds ?? 35);
}

function formatEta(seconds: number | null) {
  if (seconds === null) {
    return "Preparing ETA";
  }

  if (seconds <= 0) {
    return "Arrived";
  }

  if (seconds < 60) {
    return "Under 1 min";
  }

  return `About ${Math.ceil(seconds / 60)} min`;
}

function InvalidRecipientLink({ missionId }: { missionId: string }) {
  return (
    <section className="app-container py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <SectionCard
          eyebrow="Recipient Tracking"
          title="Tracking link unavailable"
          description="This link is invalid, expired or no longer attached to an active delivery."
        >
          <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <AlertCircle className="size-4 text-foreground" />
              </span>
              <div>
                <p className="font-medium text-foreground">Mission not found</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reference {missionId} could not be matched to a live SkySend
                  delivery. Ask the sender for a fresh recipient tracking link if
                  the delivery is still active.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

export function RecipientMissionTrackingView({
  missionId,
}: RecipientMissionTrackingViewProps) {
  const {
    currentMission,
    currentStatus,
    activeSegment,
    segmentProgress,
    dronePosition,
    droneTelemetry,
  } = useMissionRuntime();

  if (
    !currentMission ||
    !doesRecipientTokenMatchMission({
      token: missionId,
      mission: currentMission,
    })
  ) {
    return <InvalidRecipientLink missionId={missionId} />;
  }

  return (
    <ActiveRecipientMissionView
      mission={currentMission}
      currentStatus={currentStatus}
      activeSegment={activeSegment}
      segmentProgress={segmentProgress}
      dronePosition={dronePosition}
      droneTelemetry={droneTelemetry}
    />
  );
}

type ActiveRecipientMissionViewProps = {
  mission: Mission;
  currentStatus: MissionStatus | null;
  activeSegment: MissionSegment | null;
  segmentProgress: number;
  dronePosition: GeoPoint | null;
  droneTelemetry: DroneTelemetry | null;
};

function ActiveRecipientMissionView({
  mission,
  currentStatus,
  activeSegment,
  segmentProgress,
  dronePosition,
  droneTelemetry,
}: ActiveRecipientMissionViewProps) {
  const dropoffPoint = mission.dropoff.location;
  const liveDronePoint = dronePosition ?? mission.hub.address.location;
  const etaSeconds = getRemainingDropoffSeconds({
    currentStatus,
    activeSegment,
    segmentProgress,
    missionSegments: mission.segments,
  });
  const markers = useMemo<readonly MapMarkerDefinition[]>(
    () => [
      {
        id: "recipient-dropoff",
        point: dropoffPoint,
        label: mission.dropoff.label,
        description: "Approved recipient drop-off point",
        tone: "destructive",
        emphasized: true,
      },
      {
        id: "recipient-drone",
        point: liveDronePoint,
        label: "Live drone position",
        description: "Current SkySend drone telemetry position",
        tone: "warning",
        variant: "drone",
        headingDegrees: droneTelemetry?.headingDegrees ?? 0,
        emphasized: true,
      },
    ],
    [
      mission.dropoff.label,
      dropoffPoint,
      droneTelemetry?.headingDegrees,
      liveDronePoint,
    ],
  );
  const viewport = useMemo(() => getMarkerDrivenViewport(markers), [markers]);
  const lines = useMemo<readonly MapLineDefinition[]>(
    () => [
      {
        id: "recipient-remaining-route",
        data: createLineData([liveDronePoint, dropoffPoint]),
        lineColor: "#1c2940",
        lineOpacity: 0.58,
        lineWidth: 3,
        lineDasharray: [1.4, 1.2],
      },
    ],
    [dropoffPoint, liveDronePoint],
  );

  return (
    <section className="app-container flex flex-col gap-4 py-5 md:gap-6 md:py-8">
      <div className="grid gap-4 rounded-[calc(var(--radius)+0.75rem)] border border-border bg-card p-4 shadow-[var(--elevation-soft)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Recipient tracking" tone="info" />
            <StatusBadge
              label={
                currentStatus ? missionStatusLabels[currentStatus] : "Preparing"
              }
              tone={currentStatus === "mission_closed" ? "success" : "neutral"}
            />
          </div>
          <h1 className="mt-4 font-heading text-2xl tracking-tight text-foreground md:text-4xl">
            SkySend delivery tracking
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Move to the selected drop-off point when the drone is nearby.
          </p>
        </div>
        <div className="grid gap-2 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 md:min-w-52">
          <p className="text-sm text-muted-foreground">ETA to drop-off</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {formatEta(etaSeconds)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] xl:items-start">
        <div className="grid gap-4">
          <SectionCard
            eyebrow="Status"
            title={
              currentStatus ? missionStatusLabels[currentStatus] : "Mission preparing"
            }
            description={
              currentStatus
                ? missionStatusDescriptions[currentStatus]
                : "Mission status will appear here when tracking starts."
            }
          >
            <div className="grid gap-3">
              <div className="rounded-[var(--radius)] border border-border/80 bg-secondary/45 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="size-4" />
                  Drop-off point
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mission.dropoff.label}
                  {mission.dropoff.address?.formattedAddress ? (
                    <>
                      <br />
                      {mission.dropoff.address.formattedAddress}
                    </>
                  ) : null}
                </p>
              </div>

              <div className="rounded-[var(--radius)] border border-border/80 bg-background p-4">
                <p className="font-medium text-foreground">Instructions</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
                  <p>Move to the selected drop-off point when the drone is nearby.</p>
                  <p>Confirm only if the drone is above the correct point.</p>
                  <p>The locker opens only after PIN verification.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <RecipientActionPanel />
        </div>

        <div className="grid gap-4">
          <SectionCard
            eyebrow="Map"
            title="Drop-off preview"
            description="Only the drop-off point and live drone position are shown."
          >
            <LazyMapContainer
              className="min-h-[19rem] md:min-h-[25rem]"
              ariaLabel="Recipient SkySend tracking map"
              center={viewport.center}
              zoom={viewport.zoom}
              interactive
              showNavigation
              markers={markers}
              overlays={serviceAreaOverlays}
              lines={lines}
              overlayContent={
                <div className="map-overlay-card max-w-xs">
                  <p className="type-caption">Drop-off tracking</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge label={formatEta(etaSeconds)} tone="info" />
                  </div>
                </div>
              }
            />
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
