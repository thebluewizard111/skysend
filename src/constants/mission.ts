import type {
  LockerState,
  MissionAction,
  MissionStatus,
} from "@/types/mission";

export const missionStatusLabels: Record<MissionStatus, string> = {
  mission_created: "Mission created",
  preflight_checks: "Preflight checks",
  drone_dispatched: "Drone dispatched",
  en_route_to_pickup: "En route to pickup",
  arrived_at_pickup: "Arrived at pickup",
  awaiting_sender_position_confirmation: "Awaiting sender position",
  awaiting_pickup_pin: "Awaiting pickup PIN",
  pickup_safety_check: "Pickup safety check",
  locker_descending_pickup: "Locker descending",
  awaiting_parcel_load: "Awaiting parcel load",
  locker_ascending_pickup: "Locker ascending",
  payload_verification: "Payload verification",
  parcel_secured: "Parcel secured",
  en_route_to_dropoff: "En route to drop-off",
  arrived_at_dropoff: "Arrived at drop-off",
  awaiting_recipient_position_confirmation: "Awaiting recipient position",
  awaiting_recipient_pin: "Awaiting recipient PIN",
  dropoff_safety_check: "Drop-off safety check",
  locker_descending_dropoff: "Locker descending",
  awaiting_parcel_collection: "Awaiting parcel collection",
  locker_ascending_dropoff: "Locker ascending",
  delivery_completed: "Delivery completed",
  proof_generated: "Proof generated",
  mission_closed: "Mission closed",
  mission_failed: "Mission failed",
  fallback_required: "Fallback required",
};

export const missionStatusDescriptions: Record<MissionStatus, string> = {
  mission_created:
    "The confirmed order has been converted into an operational drone mission.",
  preflight_checks:
    "The hub is validating aircraft readiness, locker status and route constraints.",
  drone_dispatched:
    "The assigned drone has departed SkySend Pitești Hub.",
  en_route_to_pickup:
    "The drone is flying from the hub toward the sender pickup point.",
  arrived_at_pickup:
    "The drone has reached the pickup area and is stabilizing for handoff.",
  awaiting_sender_position_confirmation:
    "The sender must confirm they are in the approved pickup position.",
  awaiting_pickup_pin:
    "The sender must provide the pickup PIN before locker access is released.",
  pickup_safety_check:
    "The system is checking pickup area clearance before lowering the locker.",
  locker_descending_pickup:
    "The drone locker is descending for parcel loading.",
  awaiting_parcel_load:
    "The locker is ready and waiting for the sender to load the parcel.",
  locker_ascending_pickup:
    "The loaded locker is ascending back to the secured flight position.",
  payload_verification:
    "The mission is verifying parcel presence and payload constraints.",
  parcel_secured:
    "The parcel is secured and the route to drop-off is being committed.",
  en_route_to_dropoff:
    "The drone is flying toward the recipient drop-off point.",
  arrived_at_dropoff:
    "The drone has reached the drop-off area and is preparing final handoff.",
  awaiting_recipient_position_confirmation:
    "The recipient must confirm they are in the approved drop-off position.",
  awaiting_recipient_pin:
    "The recipient must provide the delivery PIN before collection is released.",
  dropoff_safety_check:
    "The system is checking drop-off area clearance before lowering the locker.",
  locker_descending_dropoff:
    "The drone locker is descending for parcel collection.",
  awaiting_parcel_collection:
    "The locker is ready and waiting for the recipient to collect the parcel.",
  locker_ascending_dropoff:
    "The emptied locker is ascending back to the secured flight position.",
  delivery_completed:
    "The parcel handoff is complete and the drone is finalizing mission records.",
  proof_generated:
    "Proof of delivery has been generated from PIN, locker and telemetry records.",
  mission_closed:
    "The operational mission has been closed.",
  mission_failed:
    "The mission cannot continue in its current operational path.",
  fallback_required:
    "The mission requires operator handling or an alternate recovery path.",
};

export const lockerStateLabels: Record<LockerState, string> = {
  attached: "Attached",
  preparing_descent: "Preparing descent",
  descending: "Descending",
  ready_for_load: "Ready for load",
  loaded: "Loaded",
  ascending: "Ascending",
  secured: "Secured",
  ready_for_unload: "Ready for unload",
  emptied: "Emptied",
  locked: "Locked",
};

export const missionActionLabels: Record<MissionAction, string> = {
  confirm_sender_position: "Confirm sender position",
  verify_pickup_pin: "Verify pickup PIN",
  confirm_parcel_loaded: "Confirm parcel loaded",
  confirm_recipient_position: "Confirm recipient position",
  verify_recipient_pin: "Verify recipient PIN",
  confirm_parcel_collected: "Confirm parcel collected",
  trigger_fallback: "Trigger fallback",
};

export type MissionDurationRange = {
  minSeconds: number;
  maxSeconds: number;
};

export type MissionDurationSeconds = number | MissionDurationRange;

export const defaultMissionDurations = {
  preflightChecks: 4,
  warehouseToPickup: {
    minSeconds: 20,
    maxSeconds: 35,
  },
  pickupSafetyCheck: 4,
  lockerDescent: 5,
  lockerAscent: 5,
  pickupToDropoff: {
    minSeconds: 25,
    maxSeconds: 40,
  },
  dropoffSafetyCheck: 4,
} satisfies Record<string, MissionDurationSeconds>;

