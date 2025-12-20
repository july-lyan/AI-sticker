import crypto from 'crypto';
import type { PaymentOrder, PaymentStore } from '../utils/paymentStore.js';
import { log } from '../utils/logger.js';

const PRICE_BY_COUNT: Record<4 | 8 | 12, number> = { 4: 1, 8: 2, 12: 3 };

export const ORDER_TTL_SECONDS = 60 * 60; // keep record for 1h
export const ORDER_EXPIRES_MINUTES = 15;

export function priceForCount(count: 4 | 8 | 12) {
  return PRICE_BY_COUNT[count];
}

export function computeTotalGrids(count: 4 | 8 | 12) {
  return count / 4;
}

export function nowIso() {
  return new Date().toISOString();
}

export function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export async function createPaymentOrder(store: PaymentStore, params: { userId: string; count: 4 | 8 | 12 }) {
  const orderId = `order_${crypto.randomUUID()}`;
  const paymentToken = `token_${crypto.randomUUID()}`;

  const totalGrids = computeTotalGrids(params.count);

  const order: PaymentOrder = {
    orderId,
    userId: params.userId,
    count: params.count,
    amount: priceForCount(params.count),
    status: 'pending',
    paymentToken,
    createdAt: nowIso(),
    expiresAt: addMinutesIso(ORDER_EXPIRES_MINUTES),
    totalGrids,
    remainingGrids: totalGrids
  };

  await store.saveOrder(order, ORDER_TTL_SECONDS);
  await store.saveToken(paymentToken, orderId, ORDER_TTL_SECONDS);

  log.info(`[Payment] Order created: ${orderId} | User: ${params.userId} | Count: ${params.count} | Amount: ¥${order.amount}`);

  return order;
}

export async function markOrderPaid(store: PaymentStore, orderId: string) {
  const order = await store.getOrderById(orderId);
  if (!order) return null;
  order.status = 'paid';
  order.paidAt = nowIso();
  await store.saveOrder(order, ORDER_TTL_SECONDS);

  log.info(`[Payment] Order paid: ${orderId} | User: ${order.userId} | Amount: ¥${order.amount} | Grids: ${order.totalGrids}`);

  return order;
}

export async function verifyOrder(store: PaymentStore, orderId: string) {
  const order = await store.getOrderById(orderId);
  return order;
}

function isExpired(order: PaymentOrder) {
  return Date.now() > Date.parse(order.expiresAt);
}

export async function assertPaymentTokenValid(
  store: PaymentStore,
  token: string,
  userId: string,
  consumeGrid: boolean = false
) {
  const orderId = await store.getOrderIdByToken(token);
  if (!orderId) {
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '请先完成支付' };
  }

  const order = await store.getOrderById(orderId);
  if (!order) {
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '订单不存在或已过期' };
  }

  if (order.userId !== userId) {
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '支付凭证不匹配当前用户' };
  }

  if (isExpired(order)) {
    order.status = 'expired';
    await store.saveOrder(order, ORDER_TTL_SECONDS);
    await store.deleteToken(token);
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '订单已过期' };
  }

  if (order.status !== 'paid') {
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '请先完成支付' };
  }

  if (order.remainingGrids <= 0) {
    await store.deleteToken(token);
    return { ok: false as const, error: 'PAYMENT_REQUIRED', message: '次数已用完，请重新购买' };
  }

  // Atomic consume: deduct grid immediately during validation to prevent race condition
  if (consumeGrid) {
    order.remainingGrids = Math.max(0, order.remainingGrids - 1);
    await store.saveOrder(order, ORDER_TTL_SECONDS);

    log.info(`[Payment] Grid consumed: ${order.orderId} | Remaining: ${order.remainingGrids}/${order.totalGrids}`);

    if (order.remainingGrids <= 0) {
      await store.deleteToken(token);
      log.info(`[Payment] Token deleted (grids exhausted): ${order.orderId}`);
    }
  }

  return { ok: true as const, orderId, order };
}

export async function consumeOneGrid(store: PaymentStore, token: string, order: PaymentOrder) {
  order.remainingGrids = Math.max(0, order.remainingGrids - 1);
  await store.saveOrder(order, ORDER_TTL_SECONDS);

  log.info(`[Payment] Grid consumed: ${order.orderId} | Remaining: ${order.remainingGrids}/${order.totalGrids}`);

  if (order.remainingGrids <= 0) {
    await store.deleteToken(token);
    log.info(`[Payment] Token deleted (grids exhausted): ${order.orderId}`);
  }
  return order;
}
