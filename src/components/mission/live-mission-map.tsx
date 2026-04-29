"use client";

import { useMemo } from "react";
import { LazyMapContainer } from "@/components/maps/lazy-map-container";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { activeHub } from "@/constants/hub";
import { useMissionRuntime } from "@/hooks/use-mission-runtime";
import { getMarkerDrivenViewport, getServiceAreaMapOverlay } from "@/lib/map";
import { interpolateGeoPoint } from "@/lib/mission-route";
import type { MapLineDefinition, MapMarkerDefinition } from "@/types/map";
import type { GeoPoint } from "@/types/service-area";
import type { MissionStatus } from "@/types/mission";

type LiveMissionMapProps = {
  fallbackPickup: {
    label: string;
    point: GeoPoint;
  };
  fallbackDropoff: {
    label: string;
    point: GeoPoint;
  };
};

const serviceAreaOverlays = [getServiceAreaMapOverlay()] as const;
const pickupReachedStatuses: MissionStatus[] = [
  "arrived_at_pickup",
  "awaiting_sender_position_confirmation",
  "awaiting_pickup_pin",
  "pickup_safety_check",
  "locker_descending_pickup",
  "awaiting_parcel_load",
  "locker_ascending_pickup",
  "payload_verification",
  "parcel_secured",
  "en_route_to_dropoff",
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

function formatSegmentLabel(value: string) {
  return value.replaceAll("_", " ");
}

function createLineData(
  points: GeoPoint[],
): MapLineDefinition["data"] {
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

function buildRouteLinePoints({
  hubPoint,
  pickupPoint,
  dropoffPoint,
  currentStatus,
  activeSegmentType,
  segmentProgress,
}: {
  hubPoint: GeoPoint;
  pickupPoint: GeoPoint;
  dropoffPoint: GeoPoint;
  currentStatus: MissionStatus | null;
  activeSegmentType?: string | null;
  segmentProgress: number;
}) {
  if (activeSegmentType === "warehouse_to_pickup") {
    const progressPoint = interpolateGeoPoint(
      hubPoint,
      pickupPoint,
      segmentProgress,
    );

    return {
      completed: [hubPoint, progressPoint],
      remaining: [progressPoint, pickupPoint, dropoffPoint],
    };
  }

  if (activeSegmentType === "pickup_to_dropoff") {
    const progressPoint = interpolateGeoPoint(
      pickupPoint,
      dropoffPoint,
      segmentProgress,
    );

    return {
      completed: [hubPoint, pickupPoint, progressPoint],
      remaining: [progressPoint, dropoffPoint],
    };
  }

  if (currentStatus && dropoffReachedStatuses.includes(currentStatus)) {
    return {
      completed: [hubPoint, pickupPoint, dropoffPoint],
      remaining: [],
    };
  }

  if (currentStatus && pickupReachedStatuses.includes(currentStatus)) {
    return {
      completed: [hubPoint, pickupPoint],
      remaining: [pickupPoint, dropoffPoint],
    };
  }

  return {
    completed: [],
    remaining: [hubPoint, pickupPoint, dropoffPoint],
  };
}

export function LiveMissionMap({
  fallbackPickup,
  fallbackDropoff,
}: LiveMissionMapProps) {
  const {
    currentMission,
    dronePosition,
    droneTelemetry,
    activeSegment,
    segmentProgress,
    currentStatus,
  } = useMissionRuntime();
  const hubPoint = currentMission?.hub.address.location ?? activeHub.address.location;
  const pickupPoint = currentMission?.pickup.location ?? fallbackPickup.point;
  const dropoffPoint = currentMission?.dropoff.location ?? fallbackDropoff.point;
  const liveDronePoint = dronePosition ?? hubPoint;
  const progressPercent = Math.round(segmentProgress * 100);
  const markers = useMemo<readonly MapMarkerDefinition[]>(
    () => [
      {
        id: "mission-hub",
        point: hubPoint,
        label: currentMission?.hub.name ?? activeHub.name,
        description: "SkySend active operations hub",
        tone: "primary",
        emphasized: true,
      },
      {
        id: "mission-pickup",
        point: pickupPoint,
        label: currentMission?.pickup.label ?? fallbackPickup.label,
        description: "Pickup handoff point",
        tone: "success",
        emphasized: true,
      },
      {
        id: "mission-dropoff",
        point: dropoffPoint,
        label: currentMission?.dropoff.label ?? fallbackDropoff.label,
        description: "Drop-off handoff point",
        tone: "destructive",
        emphasized: true,
      },
      {
        id: "mission-drone",
        point: liveDronePoint,
        label: "Live drone position",
        description: "Current drone telemetry position",
        tone: "warning",
        variant: "drone",
        headingDegrees: droneTelemetry?.headingDegrees ?? 0,
        emphasized: true,
      },
    ],
    [
      currentMission?.dropoff.label,
      currentMission?.hub.name,
      currentMission?.pickup.label,
      dropoffPoint,
      fallbackDropoff.label,
      fallbackPickup.label,
      hubPoint,
      liveDronePoint,
      pickupPoint,
      droneTelemetry?.headingDegrees,
    ],
  );
  const viewport = useMemo(() => getMarkerDrivenViewport(markers), [markers]);
  const lines = useMemo<readonly MapLineDefinition[]>(() => {
    const routeLinePoints = buildRouteLinePoints({
      hubPoint,
      pickupPoint,
      dropoffPoint,
      currentStatus,
      activeSegmentType: activeSegment?.type,
      segmentProgress,
    });

    return [
      {
        id: "mission-route-remaining",
        data: createLineData(routeLinePoints.remaining),
        lineColor: "#5d718f",
        lineOpacity: 0.45,
        lineWidth: 3,
        lineDasharray: [1.4, 1.2],
      },
      {
        id: "mission-route-completed",
        data: createLineData(routeLinePoints.completed),
        lineColor: "#1c2940",
        lineOpacity: 0.82,
        lineWidth: 4,
      },
    ];
  }, [
    activeSegment?.type,
    currentStatus,
    dropoffPoint,
    hubPoint,
    pickupPoint,
    segmentProgress,
  ]);

  return (
    <SectionCard
      eyebrow="Live Map"
      title="Mission route"
      description="The route starts at SkySend Pitesti Hub, continues to pickup and finishes at recipient drop-off."
    >
      <LazyMapContainer
        className="min-h-[22rem] md:min-h-[26rem]"
        ariaLabel="Live SkySend mission map"
        center={viewport.center}
        zoom={viewport.zoom}
        interactive
        showNavigation
        markers={markers}
        overlays={serviceAreaOverlays}
        lines={lines}
        overlayContent={
          <div className="map-overlay-card max-w-sm">
            <p className="type-caption">Live mission map</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label="Pitesti active" tone="success" />
              <StatusBadge
                label={
                  activeSegment
                    ? formatSegmentLabel(activeSegment.type)
                    : "Handoff"
                }
                tone="info"
              />
              <StatusBadge label={`${progressPercent}%`} tone="neutral" />
            </div>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusBadge
          label={
            activeSegment
              ? formatSegmentLabel(activeSegment.type)
              : "Awaiting handoff"
          }
          tone="info"
        />
        <StatusBadge label={`Progress ${progressPercent}%`} tone="neutral" />
        <StatusBadge
          label={`${liveDronePoint.latitude.toFixed(4)}, ${liveDronePoint.longitude.toFixed(4)}`}
          tone="neutral"
        />
      </div>
    </SectionCard>
  );
}
