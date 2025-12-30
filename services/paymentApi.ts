import { getJson, postJson } from './apiClient';

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export async function createPaymentOrder(params: { count: 4 | 8 | 12; deviceId: string }) {
  return postJson<{
    orderId: string;
    amount: number;
    paymentUrl: string;
    paymentToken: string;
    expiresAt: string;
    remainingGrids: number;
    totalGrids: number;
  }>(
    '/api/payment/create',
    { count: params.count },
    {
      'X-Device-Id': params.deviceId
    }
  );
}

export async function verifyPayment(params: { orderId: string; deviceId: string }) {
  return getJson<{
    status: PaymentStatus;
    orderId: string;
    paymentToken: string;
    count: number;
    paidAt?: string;
    remainingGrids: number;
    totalGrids: number;
  }>(`/api/payment/verify?orderId=${encodeURIComponent(params.orderId)}`, {
    'X-Device-Id': params.deviceId
  });
}

export async function mockPay(params: { orderId: string; deviceId: string }) {
  return postJson<{ status: PaymentStatus; orderId: string; paidAt?: string }>(
    '/api/payment/mock-pay',
    { orderId: params.orderId },
    {
      'X-Device-Id': params.deviceId
    }
  );
}

export async function getFreeQuota(deviceId: string) {
  return getJson<{
    mode: 'free' | 'paid';
    remaining: number;
    used: number;
    limit: number;
    resetAt: string;
    isFreeMode: boolean;
    isVip: boolean;
  }>(`/api/payment/quota?t=${Date.now()}`, {
    'X-Device-Id': deviceId
  });
}
