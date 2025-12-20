import { Router } from 'express';
import { z } from 'zod';
import { isProduction, PAYMENT_MODE, FREE_QUOTA_PER_DAY } from '../utils/env.js';
import { getPaymentStore } from '../utils/paymentStore.js';
import { fail, ok } from '../utils/http.js';
import { createPaymentOrder, markOrderPaid, verifyOrder } from '../services/payment.js';
import { getFreeQuota, getRemainingQuota } from '../services/freeQuota.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const CreateSchema = z.object({
  count: z.union([z.literal(4), z.literal(8), z.literal(12)])
});

router.post(
  '/create',
  asyncHandler(async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(fail('BAD_REQUEST', '参数错误', parsed.error.flatten()));
      return;
    }

    const userId = req.userId!;
    const store = await getPaymentStore();
    const order = await createPaymentOrder(store, { userId, count: parsed.data.count });

    res.json(
      ok({
        orderId: order.orderId,
        amount: order.amount,
        paymentUrl: `/payment/mock?orderId=${order.orderId}`,
        paymentToken: order.paymentToken,
        expiresAt: order.expiresAt,
        remainingGrids: order.remainingGrids,
        totalGrids: order.totalGrids
      })
    );
  })
);

router.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const orderId = String(req.query.orderId || '');
    if (!orderId) {
      res.status(400).json(fail('BAD_REQUEST', '缺少 orderId'));
      return;
    }

    const store = await getPaymentStore();
    const order = await verifyOrder(store, orderId);
    if (!order) {
      res.status(404).json(fail('NOT_FOUND', '订单不存在'));
      return;
    }

    res.json(
      ok({
        status: order.status,
        orderId: order.orderId,
        paymentToken: order.paymentToken,
        count: order.count,
        paidAt: order.paidAt,
        remainingGrids: order.remainingGrids,
        totalGrids: order.totalGrids
      })
    );
  })
);

router.post(
  '/mock-pay',
  asyncHandler(async (req, res) => {
    if (isProduction) {
      res.status(404).json(fail('NOT_FOUND', 'Not found'));
      return;
    }

    const orderId = String(req.body?.orderId || '');
    if (!orderId) {
      res.status(400).json(fail('BAD_REQUEST', '缺少 orderId'));
      return;
    }

    const store = await getPaymentStore();
    const order = await markOrderPaid(store, orderId);
    if (!order) {
      res.status(404).json(fail('NOT_FOUND', '订单不存在'));
      return;
    }

    res.json(ok({ status: order.status, orderId: order.orderId, paidAt: order.paidAt }));
  })
);

// Free quota API (only available when PAYMENT_MODE='free')
router.get(
  '/quota',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const store = await getPaymentStore();
    const quota = await getFreeQuota(store, userId);

    res.json(
      ok({
        mode: PAYMENT_MODE,
        remaining: quota.limit - quota.used,
        used: quota.used,
        limit: quota.limit,
        resetAt: quota.resetAt,
        isFreeMode: PAYMENT_MODE === 'free'
      })
    );
  })
);

export default router;
