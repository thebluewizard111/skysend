import type { Mission } from "@/types/mission";

const orderTokenPrefix = "order:";

export function getRecipientTrackingToken({
  missionId,
  orderId,
}: {
  missionId?: string | null;
  orderId: string;
}) {
  return missionId ?? `${orderTokenPrefix}${orderId}`;
}

export function getRecipientTrackingPath({
  missionId,
  orderId,
}: {
  missionId?: string | null;
  orderId: string;
}) {
  const token = getRecipientTrackingToken({ missionId, orderId });

  return `/recipient/${encodeURIComponent(token)}`;
}

export function doesRecipientTokenMatchMission({
  token,
  mission,
}: {
  token: string;
  mission: Mission;
}) {
  const decodedToken = decodeURIComponent(token);

  return (
    decodedToken === mission.id ||
    decodedToken === mission.sourceOrderId ||
    decodedToken === `${orderTokenPrefix}${mission.sourceOrderId}`
  );
}
