"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  missionRuntimeStore,
  type MissionRuntimeSnapshot,
} from "@/lib/mission-runtime";

export type UseMissionRuntimeResult = MissionRuntimeSnapshot & {
  snapshot: MissionRuntimeSnapshot;
  createMissionFromOrder: typeof missionRuntimeStore.createMissionFromOrder;
  startMission: typeof missionRuntimeStore.startMission;
  confirmSenderPosition: typeof missionRuntimeStore.confirmSenderPosition;
  verifyPickupPin: typeof missionRuntimeStore.verifyPickupPin;
  confirmParcelLoaded: typeof missionRuntimeStore.confirmParcelLoaded;
  confirmRecipientPosition: typeof missionRuntimeStore.confirmRecipientPosition;
  verifyRecipientPin: typeof missionRuntimeStore.verifyRecipientPin;
  confirmParcelCollected: typeof missionRuntimeStore.confirmParcelCollected;
  resetMission: typeof missionRuntimeStore.resetMission;
};

export function useMissionRuntime(): UseMissionRuntimeResult {
  const snapshot = useSyncExternalStore(
    missionRuntimeStore.subscribe,
    missionRuntimeStore.getSnapshot,
    missionRuntimeStore.getSnapshot,
  );

  return useMemo(
    () => ({
      snapshot,
      currentMission: snapshot.currentMission,
      currentStatus: snapshot.currentStatus,
      activeSegment: snapshot.activeSegment,
      segmentProgress: snapshot.segmentProgress,
      dronePosition: snapshot.dronePosition,
      lockerState: snapshot.lockerState,
      droneTelemetry: snapshot.droneTelemetry,
      pendingAction: snapshot.pendingAction,
      eventLog: snapshot.eventLog,
      isMissionRunning: snapshot.isMissionRunning,
      isWaitingForUser: snapshot.isWaitingForUser,
      createMissionFromOrder: missionRuntimeStore.createMissionFromOrder,
      startMission: missionRuntimeStore.startMission,
      confirmSenderPosition: missionRuntimeStore.confirmSenderPosition,
      verifyPickupPin: missionRuntimeStore.verifyPickupPin,
      confirmParcelLoaded: missionRuntimeStore.confirmParcelLoaded,
      confirmRecipientPosition: missionRuntimeStore.confirmRecipientPosition,
      verifyRecipientPin: missionRuntimeStore.verifyRecipientPin,
      confirmParcelCollected: missionRuntimeStore.confirmParcelCollected,
      resetMission: missionRuntimeStore.resetMission,
    }),
    [snapshot],
  );
}

