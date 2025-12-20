import { createClient, type RedisClientType } from 'redis';
import { REDIS_URL } from './env.js';
import { log } from './logger.js';

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export interface PaymentOrder {
  orderId: string;
  userId: string;
  count: 4 | 8 | 12;
  amount: number;
  status: PaymentStatus;
  paymentToken: string;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  totalGrids: number;
  remainingGrids: number;
}

export interface PaymentStore {
  getOrderById(orderId: string): Promise<PaymentOrder | null>;
  saveOrder(order: PaymentOrder, ttlSeconds: number): Promise<void>;
  getOrderIdByToken(token: string): Promise<string | null>;
  saveToken(token: string, orderId: string, ttlSeconds: number): Promise<void>;
  deleteToken(token: string): Promise<void>;
}

class MemoryStore implements PaymentStore {
  private orders = new Map<string, { value: PaymentOrder; expiresAtMs: number }>();
  private tokens = new Map<string, { value: string; expiresAtMs: number }>();

  async getOrderById(orderId: string): Promise<PaymentOrder | null> {
    const entry = this.orders.get(orderId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtMs) {
      this.orders.delete(orderId);
      return null;
    }
    return entry.value;
  }

  async saveOrder(order: PaymentOrder, ttlSeconds: number): Promise<void> {
    this.orders.set(order.orderId, { value: order, expiresAtMs: Date.now() + ttlSeconds * 1000 });
  }

  async getOrderIdByToken(token: string): Promise<string | null> {
    const entry = this.tokens.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtMs) {
      this.tokens.delete(token);
      return null;
    }
    return entry.value;
  }

  async saveToken(token: string, orderId: string, ttlSeconds: number): Promise<void> {
    this.tokens.set(token, { value: orderId, expiresAtMs: Date.now() + ttlSeconds * 1000 });
  }

  async deleteToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}

class RedisStore implements PaymentStore {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async getOrderById(orderId: string): Promise<PaymentOrder | null> {
    const raw = await this.client.get(`payment:${orderId}`);
    return raw ? (JSON.parse(raw) as PaymentOrder) : null;
  }

  async saveOrder(order: PaymentOrder, ttlSeconds: number): Promise<void> {
    await this.client.set(`payment:${order.orderId}`, JSON.stringify(order), { EX: ttlSeconds });
  }

  async getOrderIdByToken(token: string): Promise<string | null> {
    const orderId = await this.client.get(`paymentToken:${token}`);
    return orderId || null;
  }

  async saveToken(token: string, orderId: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`paymentToken:${token}`, orderId, { EX: ttlSeconds });
  }

  async deleteToken(token: string): Promise<void> {
    await this.client.del(`paymentToken:${token}`);
  }
}

let singleton: PaymentStore | null = null;

export async function getPaymentStore(): Promise<PaymentStore> {
  if (singleton) return singleton;

  if (!REDIS_URL) {
    log.warn('REDIS_URL not set; using in-memory payment store (dev only).');
    singleton = new MemoryStore();
    return singleton;
  }

  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => log.error('Redis error:', err));
  await client.connect();
  log.info('Redis connected.');

  singleton = new RedisStore(client);
  return singleton;
}
