import { activeHub } from "@/constants/hub";
import { missionActionLabels } from "@/constants/mission";
import {
  appendMissionEvent,
  createActionEvent,
  createStatusChangeEvent,
  createSystemEvent,
} from "@/lib/mission-events";
import { generateMissionPins, validateMissionPin } from "@/lib/mission-pin";
import {
  buildMissionSegments,
  calculateHeadingDegrees,
  interpolateGeoPoint,
} from "@/lib/mission-route";
import {
  getAllowedMissionAction,
  getLockerStateForStatus,
  getMissionPhaseForStatus,
  getMissionStepConfig,
  isMissionWaitingForUser,
} from "@/lib/mission-state-machine";
import type { CreatedDeliveryOrder } from "@/types/create-delivery";
import type { AddressSnapshot } from "@/types/entities";
import type { GeoPoint } from "@/types/service-area";
import type {
  DroneTelemetry,
  LockerState,
  Mission,
  MissionAction,
  MissionActionRequirement,
  MissionActor,
  MissionEvent,
  MissionParticipant,
  MissionPin,
  MissionRoutePoint,
  MissionSegment,
  MissionStatus,
} from "@/types/mission";

export type MissionRuntimeSnapshot = {
  currentMission: Mission | null;
  currentStatus: MissionStatus | null;
  activeSegment: MissionSegment | null;
  segmentProgress: number;
  dronePosition: GeoPoint | null;
  lockerState: LockerState | null;
  droneTelemetry: DroneTelemetry | null;
  pendingAction: MissionAction | null;
  eventLog: MissionEvent[];
  isMissionRunning: boolean;
  isWaitingForUser: boolean;
};

export type MissionRuntimeListener = (
  snapshot: MissionRuntimeSnapshot,
) => void;

type RuntimeTimers = {
  stepTimeout: ReturnType<typeof setTimeout> | null;
  progressInterval: ReturnType<typeof setInterval> | null;
};

const initialSnapshot: MissionRuntimeSnapshot = {
  currentMission: null,
  currentStatus: null,
  activeSegment: null,
  segmentProgress: 0,
  dronePosition: null,
  lockerState: null,
  droneTelemetry: null,
  pendingAction: null,
  eventLog: [],
  isMissionRunning: false,
  isWaitingForUser: false,
};

const knownMissionStatuses: MissionStatus[] = [
  "mission_created",
  "preflight_checks",
  "drone_dispatched",
  "en_route_to_pickup",
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
  "mission_failed",
  "fallback_required",
];
const finalProofStatuses: MissionStatus[] = [
  "delivery_completed",
  "proof_generated",
  "mission_closed",
];

let snapshot = initialSnapshot;
const listeners = new Set<MissionRuntimeListener>();
const timers: RuntimeTimers = {
  stepTimeout: null,
  progressInterval: null,
};

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function canRunTimers() {
  return typeof window !== "undefined";
}

function createRuntimeId(prefix: string, sourceId: string) {
  const entropy =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${sourceId}_${entropy}`;
}

function isKnownMissionStatus(
  status?: string | null,
): status is MissionStatus {
  return Boolean(
    status && knownMissionStatuses.includes(status as MissionStatus),
  );
}

function isFinalProofStatus(status: MissionStatus) {
  return finalProofStatuses.includes(status);
}

function getInitialMissionStatusForOrder(order: CreatedDeliveryOrder): MissionStatus {
  if (
    order.fulfillmentStatus === "completed_mission" &&
    isKnownMissionStatus(order.missionStatus) &&
    isFinalProofStatus(order.missionStatus)
  ) {
    return order.missionStatus;
  }

  if (order.fulfillmentStatus === "completed_mission") {
    return "proof_generated";
  }

  if (order.fulfillmentStatus === "failed_mission") {
    return "mission_failed";
  }

  if (order.fulfillmentStatus === "fallback_required") {
    return "fallback_required";
  }

  if (isKnownMissionStatus(order.missionStatus)) {
    return order.missionStatus;
  }

  return "mission_created";
}

function notifyListeners() {
  listeners.forEach((listener) => listener(snapshot));
}

function setSnapshot(nextSnapshot: MissionRuntimeSnapshot) {
  snapshot = nextSnapshot;
  notifyListeners();
}

function clearRuntimeTimers() {
  if (timers.stepTimeout) {
    clearTimeout(timers.stepTimeout);
    timers.stepTimeout = null;
  }

  if (timers.progressInterval) {
    clearInterval(timers.progressInterval);
    timers.progressInterval = null;
  }
}

function toAddressSnapshot(
  address: CreatedDeliveryOrder["payload"]["pickupAddress"],
): AddressSnapshot {
  return {
    formattedAddress: address.formattedAddress,
    city: address.city ?? activeHub.address.city,
    county: address.county ?? activeHub.address.county,
    country: address.country ?? activeHub.address.country,
    postalCode: address.postalCode,
    location: address.location,
  };
}

function toMissionRoutePoint({
  label,
  address,
}: {
  label: string;
  address: CreatedDeliveryOrder["payload"]["pickupAddress"];
}): MissionRoutePoint {
  return {
    label,
    location: address.location,
    address: toAddressSnapshot(address),
  };
}

function getActionActor(action: MissionAction): MissionActor {
  if (
    action === "confirm_sender_position" ||
    action === "verify_pickup_pin" ||
    action === "confirm_parcel_loaded"
  ) {
    return "sender";
  }

  if (
    action === "confirm_recipient_position" ||
    action === "verify_recipient_pin" ||
    action === "confirm_parcel_collected"
  ) {
    return "recipient";
  }

  return "operator";
}

function getPendingActionRequirement(
  status: MissionStatus,
): MissionActionRequirement | null {
  const action = getAllowedMissionAction(status);

  if (!action) {
    return null;
  }

  return {
    action,
    actor: getActionActor(action),
    label: missionActionLabels[action],
  };
}

function getPendingActions(status: MissionStatus): MissionActionRequirement[] {
  const requirement = getPendingActionRequirement(status);

  return requirement ? [requirement] : [];
}

function getActiveSegmentForStatus(
  mission: Mission,
  status: MissionStatus,
): MissionSegment | null {
  if (
    status === "drone_dispatched" ||
    status === "en_route_to_pickup" ||
    status === "arrived_at_pickup"
  ) {
    return (
      mission.segments.find((segment) => segment.type === "warehouse_to_pickup") ??
      null
    );
  }

  if (
    status === "parcel_secured" ||
    status === "en_route_to_dropoff" ||
    status === "arrived_at_dropoff"
  ) {
    return (
      mission.segments.find((segment) => segment.type === "pickup_to_dropoff") ??
      null
    );
  }

  return null;
}

function getProgressForStatus(status: MissionStatus, currentProgress: number) {
  if (status === "arrived_at_pickup" || status === "arrived_at_dropoff") {
    return 1;
  }

  if (status === "en_route_to_pickup" || status === "en_route_to_dropoff") {
    return currentProgress;
  }

  return 0;
}

function getDronePosition(
  mission: Mission,
  activeSegment: MissionSegment | null,
  progress: number,
): GeoPoint {
  if (!activeSegment) {
    return snapshot.dronePosition ?? mission.hub.address.location;
  }

  return interpolateGeoPoint(
    activeSegment.from.location,
    activeSegment.to.location,
    progress,
  );
}

function createTelemetry({
  mission,
  status,
  activeSegment,
  position,
  lockerState,
  progress,
}: {
  mission: Mission;
  status: MissionStatus;
  activeSegment: MissionSegment | null;
  position: GeoPoint;
  lockerState: LockerState;
  progress: number;
}): DroneTelemetry {
  const headingDegrees = activeSegment
    ? calculateHeadingDegrees(
        activeSegment.from.location,
        activeSegment.to.location,
      )
    : snapshot.droneTelemetry?.headingDegrees ?? 0;
  const distanceMeters = (activeSegment?.distanceKm ?? 0) * 1000;
  const durationSeconds = activeSegment?.plannedDurationSeconds ?? 1;
  const isFlying = Boolean(activeSegment && progress > 0 && progress < 1);
  const payloadStatuses: MissionStatus[] = [
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
  ];
  const payloadWeightKg = payloadStatuses.includes(status) ? 1.8 : 0;
  const batteryUsed =
    mission.events.length * 1.4 +
    (status === "en_route_to_pickup" || status === "en_route_to_dropoff"
      ? progress * 4
      : 0);
  const signalDip = isFlying ? Math.round(progress * 2) : 0;

  return {
    droneId: mission.droneId ?? `${mission.droneClass}_runtime`,
    recordedAt: getCurrentTimestamp(),
    location: position,
    altitudeMeters: isFlying ? 82 : 18,
    groundSpeedMps: isFlying
      ? Math.round((distanceMeters / durationSeconds) * 10) / 10
      : 0,
    headingDegrees,
    batteryPercent: Math.max(35, Math.round(100 - batteryUsed)),
    signalPercent: Math.max(91, 97 - signalDip),
    payloadWeightKg,
    lockerState,
  };
}

function updateSegmentsForStatus(
  segments: MissionSegment[],
  status: MissionStatus,
): MissionSegment[] {
  return segments.map((segment) => {
    const isPickupSegment = segment.type === "warehouse_to_pickup";
    const isDropoffSegment = segment.type === "pickup_to_dropoff";
    const pickupDoneStatuses: MissionStatus[] = [
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
    const dropoffDoneStatuses: MissionStatus[] = [
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

    if (isPickupSegment && status === "en_route_to_pickup") {
      return { ...segment, state: "active" };
    }

    if (isDropoffSegment && status === "en_route_to_dropoff") {
      return { ...segment, state: "active" };
    }

    if (isPickupSegment && pickupDoneStatuses.includes(status)) {
      return { ...segment, state: "completed" };
    }

    if (isDropoffSegment && dropoffDoneStatuses.includes(status)) {
      return { ...segment, state: "completed" };
    }

    if (status === "mission_failed" || status === "fallback_required") {
      return segment.state === "active" ? { ...segment, state: "failed" } : segment;
    }

    return segment.state === "active" ? { ...segment, state: "pending" } : segment;
  });
}

function applyMissionStatus(
  mission: Mission,
  status: MissionStatus,
  events: MissionEvent[] = mission.events,
  progress = snapshot.segmentProgress,
): MissionRuntimeSnapshot {
  const lockerState = getLockerStateForStatus(status) ?? mission.locker.state;
  const nextMission: Mission = {
    ...mission,
    status,
    phase: getMissionPhaseForStatus(status),
    updatedAt: getCurrentTimestamp(),
    locker: {
      ...mission.locker,
      state: lockerState,
      lastStateChangedAt:
        lockerState === mission.locker.state
          ? mission.locker.lastStateChangedAt
          : getCurrentTimestamp(),
    },
    pendingActions: getPendingActions(status),
    events,
    segments: updateSegmentsForStatus(mission.segments, status),
  };
  const activeSegment = getActiveSegmentForStatus(nextMission, status);
  const segmentProgress = getProgressForStatus(status, progress);
  const dronePosition = getDronePosition(
    nextMission,
    activeSegment,
    segmentProgress,
  );
  const droneTelemetry = createTelemetry({
    mission: nextMission,
    status,
    activeSegment,
    position: dronePosition,
    lockerState,
    progress: segmentProgress,
  });
  const telemetryLog = [
    ...(nextMission.telemetryLog ?? []),
    droneTelemetry,
  ].slice(-50);
  const missionWithTelemetry: Mission = {
    ...nextMission,
    latestTelemetry: droneTelemetry,
    telemetryLog,
  };
  const stepConfig = getMissionStepConfig(status);

  return {
    currentMission: missionWithTelemetry,
    currentStatus: status,
    activeSegment,
    segmentProgress,
    dronePosition,
    lockerState,
    droneTelemetry,
    pendingAction: getAllowedMissionAction(status),
    eventLog: events,
    isMissionRunning: stepConfig.advanceMode !== "terminal",
    isWaitingForUser: isMissionWaitingForUser(status),
  };
}

function getStepDurationSeconds(
  mission: Mission,
  status: MissionStatus,
  activeSegment: MissionSegment | null,
) {
  if (
    (status === "en_route_to_pickup" || status === "en_route_to_dropoff") &&
    activeSegment?.plannedDurationSeconds
  ) {
    return activeSegment.plannedDurationSeconds;
  }

  return getMissionStepConfig(status).durationSeconds ?? 0;
}

function scheduleAutomaticProgress() {
  clearRuntimeTimers();

  const mission = snapshot.currentMission;
  const status = snapshot.currentStatus;

  if (!mission || !status || isMissionWaitingForUser(status)) {
    return;
  }

  const stepConfig = getMissionStepConfig(status);

  if (stepConfig.advanceMode !== "automatic") {
    return;
  }

  const durationSeconds = getStepDurationSeconds(
    mission,
    status,
    snapshot.activeSegment,
  );
  const durationMs = durationSeconds * 1000;
  const startedAt = Date.now();

  if (!canRunTimers() || durationMs <= 0) {
    return;
  }

  if (
    status === "en_route_to_pickup" ||
    status === "en_route_to_dropoff"
  ) {
    timers.progressInterval = setInterval(() => {
      const currentMission = snapshot.currentMission;
      const currentStatus = snapshot.currentStatus;

      if (!currentMission || currentStatus !== status) {
        clearRuntimeTimers();
        return;
      }

      const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
      setSnapshot(
        applyMissionStatus(
          currentMission,
          status,
          currentMission.events,
          progress,
        ),
      );
    }, 250);
  }

  timers.stepTimeout = setTimeout(() => {
    completeCurrentAutomaticStep();
  }, durationMs);
}

function transitionToStatus(
  mission: Mission,
  status: MissionStatus,
  extraEvents: MissionEvent[] = [],
) {
  const event = createStatusChangeEvent({
    missionId: mission.id,
    status,
  });
  const events = [...mission.events, ...extraEvents, event];

  setSnapshot(applyMissionStatus(mission, status, events));
  scheduleAutomaticProgress();

  return snapshot;
}

function getCurrentMission() {
  return snapshot.currentMission;
}

function runRequiredAction(action: MissionAction, actor: MissionActor) {
  const mission = getCurrentMission();
  const status = snapshot.currentStatus;

  if (!mission || !status || getAllowedMissionAction(status) !== action) {
    return snapshot;
  }

  const actionEvent = createActionEvent({
    missionId: mission.id,
    status,
    action,
    actor,
  });
  const missionWithActionEvent = appendMissionEvent(mission, actionEvent);

  return advanceMission(missionWithActionEvent.events);
}

function updateMissionPins(mission: Mission, pins: MissionPin[]) {
  return {
    ...mission,
    pins,
  };
}

function findMissionPin(mission: Mission, purpose: MissionPin["purpose"]) {
  return mission.pins.find((pin) => pin.purpose === purpose) ?? null;
}

export function subscribeMissionRuntime(listener: MissionRuntimeListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getMissionRuntimeSnapshot() {
  return snapshot;
}

export function createMissionFromOrder(order: CreatedDeliveryOrder): Mission {
  clearRuntimeTimers();

  const missionId = order.missionId ?? createRuntimeId("mission", order.id);
  const createdAt = getCurrentTimestamp();
  const initialStatus = getInitialMissionStatusForOrder(order);
  const isRestoredCompletedMission =
    order.fulfillmentStatus === "completed_mission";
  const completedAt =
    isRestoredCompletedMission || initialStatus === "mission_failed"
      ? order.completedAt ?? createdAt
      : null;
  const senderParticipantId = `${missionId}:sender`;
  const recipientParticipantId = `${missionId}:recipient`;
  const pickup = toMissionRoutePoint({
    label: order.payload.selectedPickupPoint.label,
    address: order.payload.pickupAddress,
  });
  const dropoff = toMissionRoutePoint({
    label: order.payload.selectedDropoffPoint.label,
    address: order.payload.dropoffAddress,
  });
  const participants: MissionParticipant[] = [
    {
      id: senderParticipantId,
      missionId,
      role: "sender",
      profileId: order.payload.userId,
      displayName: "Sender",
    },
    {
      id: recipientParticipantId,
      missionId,
      role: "recipient",
      profileId: null,
      displayName: "Recipient",
    },
  ];
  const pins = generateMissionPins({
    missionId,
    senderParticipantId,
    recipientParticipantId,
    issuedAt: createdAt,
  }).map((pin) =>
    isRestoredCompletedMission
      ? {
          ...pin,
          status: "verified" as const,
          verifiedAt: order.completedAt ?? createdAt,
        }
      : pin,
  );
  const initialEvent = createStatusChangeEvent({
    missionId,
    status: initialStatus,
    timestamp: createdAt,
  });
  const mission: Mission = {
    id: missionId,
    sourceOrderId: order.id,
    orderSnapshot: {
      orderId: order.id,
      pickupPointId: order.payload.selectedPickupPoint.id,
      dropoffPointId: order.payload.selectedDropoffPoint.id,
      parcelId: `${order.id}:parcel`,
    },
    status: initialStatus,
    phase: getMissionPhaseForStatus(initialStatus),
    droneId: createRuntimeId("drone", order.payload.recommendedDroneClass),
    droneClass: order.payload.recommendedDroneClass,
    hub: activeHub,
    locker: {
      id: createRuntimeId("locker", order.id),
      state: getLockerStateForStatus(initialStatus) ?? "attached",
      lastStateChangedAt: createdAt,
    },
    pickup,
    dropoff,
    segments: buildMissionSegments({
      missionId,
      pickup,
      dropoff,
      warehouse: activeHub,
    }),
    participants,
    pendingActions: getPendingActions(initialStatus),
    pins,
    events: [initialEvent],
    latestTelemetry: null,
    telemetryLog: [],
    proofs: [],
    failureReason: null,
    fallbackMissionId: null,
    startedAt: isRestoredCompletedMission ? order.paidAt ?? createdAt : null,
    completedAt,
    closedAt: initialStatus === "mission_closed" ? completedAt : null,
    createdAt,
    updatedAt: createdAt,
  };

  setSnapshot({
    ...applyMissionStatus(mission, initialStatus, mission.events, 0),
    isMissionRunning: false,
  });

  return snapshot.currentMission ?? mission;
}

export function startMission() {
  const mission = getCurrentMission();

  if (!mission) {
    return snapshot;
  }

  setSnapshot({
    ...snapshot,
    currentMission: {
      ...mission,
      startedAt: mission.startedAt ?? getCurrentTimestamp(),
    },
    isMissionRunning: true,
  });
  scheduleAutomaticProgress();

  return snapshot;
}

export function advanceMission(eventsOverride?: MissionEvent[]) {
  const mission = getCurrentMission();
  const status = snapshot.currentStatus;

  if (!mission || !status) {
    return snapshot;
  }

  const nextStatus = getMissionStepConfig(status).nextStatus;

  if (!nextStatus) {
    clearRuntimeTimers();
    return snapshot;
  }

  return transitionToStatus(
    {
      ...mission,
      events: eventsOverride ?? mission.events,
    },
    nextStatus,
  );
}

export function completeCurrentAutomaticStep() {
  const status = snapshot.currentStatus;

  if (!status || isMissionWaitingForUser(status)) {
    return snapshot;
  }

  return advanceMission();
}

export function confirmSenderPosition() {
  return runRequiredAction("confirm_sender_position", "sender");
}

export function verifyPickupPin(code?: string) {
  const mission = getCurrentMission();
  const status = snapshot.currentStatus;

  if (!mission || status !== "awaiting_pickup_pin") {
    return snapshot;
  }

  const pickupPin = findMissionPin(mission, "pickup_verification");

  if (!pickupPin) {
    const event = createSystemEvent({
      missionId: mission.id,
      status,
      title: "Pickup PIN unavailable",
      description: "The pickup PIN could not be found for this mission.",
    });
    setSnapshot(applyMissionStatus(mission, status, [...mission.events, event]));
    return snapshot;
  }

  const result = validateMissionPin(pickupPin, code ?? pickupPin.code);
  const pins = mission.pins.map((pin) =>
    pin.id === result.pin.id ? result.pin : pin,
  );
  const missionWithPins = updateMissionPins(mission, pins);

  if (!result.valid) {
    const event = createSystemEvent({
      missionId: mission.id,
      status,
      title: "Pickup PIN rejected",
      description: result.message,
    });
    setSnapshot(
      applyMissionStatus(missionWithPins, status, [
        ...mission.events,
        event,
      ]),
    );
    return snapshot;
  }

  const actionEvent = createActionEvent({
    missionId: mission.id,
    status,
    action: "verify_pickup_pin",
    actor: "sender",
  });
  const nextStatus = getMissionStepConfig(status).nextStatus;

  if (!nextStatus) {
    return snapshot;
  }

  return transitionToStatus(
    {
      ...missionWithPins,
      events: [...mission.events, actionEvent],
    },
    nextStatus,
  );
}

export function confirmParcelLoaded() {
  return runRequiredAction("confirm_parcel_loaded", "sender");
}

export function confirmRecipientPosition() {
  return runRequiredAction("confirm_recipient_position", "recipient");
}

export function verifyRecipientPin(code?: string) {
  const mission = getCurrentMission();
  const status = snapshot.currentStatus;

  if (!mission || status !== "awaiting_recipient_pin") {
    return snapshot;
  }

  const recipientPin = findMissionPin(mission, "dropoff_verification");

  if (!recipientPin) {
    const event = createSystemEvent({
      missionId: mission.id,
      status,
      title: "Recipient PIN unavailable",
      description: "The recipient PIN could not be found for this mission.",
    });
    setSnapshot(applyMissionStatus(mission, status, [...mission.events, event]));
    return snapshot;
  }

  const result = validateMissionPin(recipientPin, code ?? recipientPin.code);
  const pins = mission.pins.map((pin) =>
    pin.id === result.pin.id ? result.pin : pin,
  );
  const missionWithPins = updateMissionPins(mission, pins);

  if (!result.valid) {
    const event = createSystemEvent({
      missionId: mission.id,
      status,
      title: "Recipient PIN rejected",
      description: result.message,
    });
    setSnapshot(
      applyMissionStatus(missionWithPins, status, [
        ...mission.events,
        event,
      ]),
    );
    return snapshot;
  }

  const actionEvent = createActionEvent({
    missionId: mission.id,
    status,
    action: "verify_recipient_pin",
    actor: "recipient",
  });
  const nextStatus = getMissionStepConfig(status).nextStatus;

  if (!nextStatus) {
    return snapshot;
  }

  return transitionToStatus(
    {
      ...missionWithPins,
      events: [...mission.events, actionEvent],
    },
    nextStatus,
  );
}

export function confirmParcelCollected() {
  return runRequiredAction("confirm_parcel_collected", "recipient");
}

export function resetMission() {
  clearRuntimeTimers();
  setSnapshot(initialSnapshot);

  return snapshot;
}

export const missionRuntimeStore = {
  subscribe: subscribeMissionRuntime,
  getSnapshot: getMissionRuntimeSnapshot,
  createMissionFromOrder,
  startMission,
  advanceMission,
  completeCurrentAutomaticStep,
  confirmSenderPosition,
  verifyPickupPin,
  confirmParcelLoaded,
  confirmRecipientPosition,
  verifyRecipientPin,
  confirmParcelCollected,
  resetMission,
};
