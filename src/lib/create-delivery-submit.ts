import type {
  CreatedDeliveryFulfillmentStatus,
  CreatedDeliveryOrder,
  CreatedDeliveryPaymentStatus,
  CreateDeliveryPayload,
  CreateDeliverySubmitStatus,
} from "@/types/create-delivery";

const createdOrderStoragePrefix = "skysend:create-delivery:order:";

function createLocalOrderId(createdAt: string) {
  const timestamp = Math.abs(Date.parse(createdAt) % 90000) + 10000;
  const entropy =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/\D/g, "").slice(0, 3)
      : Math.floor(Math.random() * 900 + 100).toString();

  return `SKY-PT-${timestamp}-${entropy.padEnd(3, "0")}`;
}

function getInitialOrderStatus(
  payload: CreateDeliveryPayload,
): CreateDeliverySubmitStatus {
  return payload.coverageStatus === "review" ? "pending_review" : "scheduled";
}

export async function submitCreateDeliveryMock(
  payload: CreateDeliveryPayload,
): Promise<CreatedDeliveryOrder> {
  await new Promise((resolve) => window.setTimeout(resolve, 450));

  const id = createLocalOrderId(payload.createdAt);
  const createdOrder: CreatedDeliveryOrder = {
    id,
    status: getInitialOrderStatus(payload),
    paymentStatus: "unpaid",
    fulfillmentStatus: "order_created",
    missionId: null,
    missionStatus: null,
    stripePaymentIntentId: null,
    paidAt: null,
    completedAt: null,
    href: `/client/orders/${id}`,
    payload,
  };

  window.sessionStorage.setItem(
    `${createdOrderStoragePrefix}${id}`,
    JSON.stringify(createdOrder),
  );

  return createdOrder;
}

export function readCreatedDeliveryOrders(): CreatedDeliveryOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  const orders: CreatedDeliveryOrder[] = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);

    if (!key?.startsWith(createdOrderStoragePrefix)) {
      continue;
    }

    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      continue;
    }

    try {
      orders.push(JSON.parse(rawValue) as CreatedDeliveryOrder);
    } catch {
      continue;
    }
  }

  return orders.sort(
    (left, right) =>
      Date.parse(right.payload.createdAt) - Date.parse(left.payload.createdAt),
  );
}

export function readCreatedDeliveryOrder(
  orderId: string,
): CreatedDeliveryOrder | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(
    `${createdOrderStoragePrefix}${orderId}`,
  );

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as CreatedDeliveryOrder;
  } catch {
    return null;
  }
}

export function updateCreatedDeliveryOrderPayment({
  orderId,
  paymentStatus,
  stripePaymentIntentId,
}: {
  orderId: string;
  paymentStatus: CreatedDeliveryPaymentStatus;
  stripePaymentIntentId?: string | null;
}): CreatedDeliveryOrder | null {
  const order = readCreatedDeliveryOrder(orderId);

  if (!order) {
    return null;
  }

  const updatedOrder: CreatedDeliveryOrder = {
    ...order,
    paymentStatus,
    stripePaymentIntentId:
      stripePaymentIntentId ?? order.stripePaymentIntentId ?? null,
    paidAt:
      paymentStatus === "paid"
        ? new Date().toISOString()
        : order.paidAt ?? null,
  };

  window.sessionStorage.setItem(
    `${createdOrderStoragePrefix}${orderId}`,
    JSON.stringify(updatedOrder),
  );

  return updatedOrder;
}

export function updateCreatedDeliveryOrderFulfillment({
  orderId,
  fulfillmentStatus,
  missionId,
  missionStatus,
  completedAt,
}: {
  orderId: string;
  fulfillmentStatus: CreatedDeliveryFulfillmentStatus;
  missionId?: string | null;
  missionStatus?: string | null;
  completedAt?: string | null;
}): CreatedDeliveryOrder | null {
  const order = readCreatedDeliveryOrder(orderId);

  if (!order) {
    return null;
  }

  const updatedOrder: CreatedDeliveryOrder = {
    ...order,
    fulfillmentStatus,
    missionId: missionId ?? order.missionId ?? null,
    missionStatus: missionStatus ?? order.missionStatus ?? null,
    completedAt:
      completedAt ??
      (fulfillmentStatus === "completed_mission"
        ? new Date().toISOString()
        : order.completedAt ?? null),
  };

  window.sessionStorage.setItem(
    `${createdOrderStoragePrefix}${orderId}`,
    JSON.stringify(updatedOrder),
  );

  return updatedOrder;
}
