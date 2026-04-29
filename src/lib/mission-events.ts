import { activeHub } from "@/constants/hub";
import {
  missionActionLabels,
  missionStatusDescriptions,
  missionStatusLabels,
} from "@/constants/mission";
import type {
  Mission,
  MissionAction,
  MissionActor,
  MissionEvent,
  MissionEventId,
  MissionId,
  MissionStatus,
} from "@/types/mission";

export type MissionEventInput = {
  missionId: MissionId;
  status: MissionStatus;
  title: string;
  description: string;
  actor?: MissionActor;
  timestamp?: string;
  id?: MissionEventId;
};

export type StatusChangeEventInput = {
  missionId: MissionId;
  status: MissionStatus;
  timestamp?: string;
  actor?: MissionActor;
};

export type ActionEventInput = {
  missionId: MissionId;
  status: MissionStatus;
  action: MissionAction;
  timestamp?: string;
  actor?: MissionActor;
};

export type SystemEventInput = {
  missionId: MissionId;
  status: MissionStatus;
  title: string;
  description: string;
  timestamp?: string;
};

const statusEventCopy: Partial<
  Record<MissionStatus, Pick<MissionEvent, "title" | "description" | "actor">>
> = {
  mission_created: {
    title: "Mission created",
    description:
      "The confirmed order was converted into an operational drone mission.",
    actor: "system",
  },
  preflight_checks: {
    title: "Preflight checks completed",
    description:
      "Aircraft readiness, locker state and route constraints passed operational checks.",
    actor: "system",
  },
  drone_dispatched: {
    title: `Drone dispatched from ${activeHub.name}`,
    description:
      "The assigned drone departed the active SkySend hub and is proceeding to pickup.",
    actor: "operator",
  },
  en_route_to_pickup: {
    title: "Drone en route to pickup",
    description:
      "The drone is flying from the hub toward the sender pickup point.",
    actor: "system",
  },
  arrived_at_pickup: {
    title: "Arrived at pickup",
    description:
      "The drone reached the pickup area and is waiting for sender handoff clearance.",
    actor: "system",
  },
  pickup_safety_check: {
    title: "Pickup safety check completed",
    description:
      "The pickup zone was cleared for locker descent and parcel handoff.",
    actor: "system",
  },
  locker_descending_pickup: {
    title: "Locker lowered",
    description: "The drone lowered the locker for sender parcel loading.",
    actor: "system",
  },
  locker_ascending_pickup: {
    title: "Locker secured after pickup",
    description:
      "The loaded locker returned to its secured flight position.",
    actor: "system",
  },
  payload_verification: {
    title: "Payload verified",
    description:
      "The mission verified parcel presence and payload constraints.",
    actor: "system",
  },
  parcel_secured: {
    title: "Drone departed to recipient",
    description:
      "The parcel is secured and the drone has committed to the drop-off route.",
    actor: "system",
  },
  en_route_to_dropoff: {
    title: "Drone en route to recipient",
    description:
      "The drone is flying toward the recipient drop-off point.",
    actor: "system",
  },
  arrived_at_dropoff: {
    title: "Arrived at drop-off",
    description:
      "The drone reached the drop-off area and is preparing recipient handoff.",
    actor: "system",
  },
  dropoff_safety_check: {
    title: "Drop-off safety check completed",
    description:
      "The drop-off zone was cleared for locker descent and parcel collection.",
    actor: "system",
  },
  locker_descending_dropoff: {
    title: "Locker lowered",
    description: "The drone lowered the locker for recipient collection.",
    actor: "system",
  },
  locker_ascending_dropoff: {
    title: "Locker secured after drop-off",
    description:
      "The emptied locker returned to its secured flight position.",
    actor: "system",
  },
  delivery_completed: {
    title: "Delivery completed",
    description:
      "The recipient handoff was completed and mission closeout started.",
    actor: "system",
  },
  proof_generated: {
    title: "Proof generated",
    description:
      "Proof of delivery was generated from handoff, locker and telemetry records.",
    actor: "system",
  },
  mission_closed: {
    title: "Mission closed",
    description: "The operational mission record was closed.",
    actor: "system",
  },
  mission_failed: {
    title: "Mission failed",
    description: "The mission could not continue on the active route.",
    actor: "operator",
  },
  fallback_required: {
    title: "Fallback required",
    description:
      "The mission requires operator handling or an alternate recovery path.",
    actor: "operator",
  },
};

const actionEventCopy: Record<
  MissionAction,
  Pick<MissionEvent, "title" | "description" | "actor">
> = {
  confirm_sender_position: {
    title: "Sender position confirmed",
    description:
      "The sender confirmed they are present at the approved pickup point.",
    actor: "sender",
  },
  verify_pickup_pin: {
    title: "Pickup PIN verified",
    description:
      "The pickup PIN was verified and the mission can continue to parcel handoff.",
    actor: "sender",
  },
  confirm_parcel_loaded: {
    title: "Parcel loaded",
    description:
      "The sender confirmed the parcel was placed inside the drone locker.",
    actor: "sender",
  },
  confirm_recipient_position: {
    title: "Recipient position confirmed",
    description:
      "The recipient confirmed they are present at the approved drop-off point.",
    actor: "recipient",
  },
  verify_recipient_pin: {
    title: "Recipient PIN verified",
    description:
      "The recipient PIN was verified and parcel collection can continue.",
    actor: "recipient",
  },
  confirm_parcel_collected: {
    title: "Parcel collected",
    description:
      "The recipient confirmed the parcel was collected from the drone locker.",
    actor: "recipient",
  },
  trigger_fallback: {
    title: "Fallback triggered",
    description:
      "An operator triggered fallback handling for the active mission.",
    actor: "operator",
  },
};

function createMissionEventId(
  missionId: MissionId,
  timestamp: string,
): MissionEventId {
  const entropy =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  const safeTimestamp = Date.parse(timestamp).toString(36);

  return `event_${missionId}_${safeTimestamp}_${entropy}`;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

export function createMissionEvent({
  missionId,
  status,
  title,
  description,
  actor = "system",
  timestamp = getCurrentTimestamp(),
  id,
}: MissionEventInput): MissionEvent {
  return {
    id: id ?? createMissionEventId(missionId, timestamp),
    missionId,
    timestamp,
    status,
    title,
    description,
    actor,
  };
}

export function createStatusChangeEvent({
  missionId,
  status,
  timestamp,
  actor,
}: StatusChangeEventInput): MissionEvent {
  const copy = statusEventCopy[status] ?? {
    title: missionStatusLabels[status],
    description: missionStatusDescriptions[status],
    actor: "system" as const,
  };

  return createMissionEvent({
    missionId,
    status,
    timestamp,
    title: copy.title,
    description: copy.description,
    actor: actor ?? copy.actor,
  });
}

export function createActionEvent({
  missionId,
  status,
  action,
  timestamp,
  actor,
}: ActionEventInput): MissionEvent {
  const copy = actionEventCopy[action];

  return createMissionEvent({
    missionId,
    status,
    timestamp,
    title: copy.title ?? missionActionLabels[action],
    description: copy.description,
    actor: actor ?? copy.actor,
  });
}

export function createSystemEvent({
  missionId,
  status,
  title,
  description,
  timestamp,
}: SystemEventInput): MissionEvent {
  return createMissionEvent({
    missionId,
    status,
    title,
    description,
    timestamp,
    actor: "system",
  });
}

export function appendMissionEvent(
  mission: Mission,
  event: MissionEvent,
): Mission {
  return {
    ...mission,
    events: [...mission.events, event],
  };
}

