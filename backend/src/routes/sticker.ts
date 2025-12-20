import { Router } from 'express';
import { z } from 'zod';
import { fail, ok } from '../utils/http.js';
import { generateStickerGrid, generateStickerImage } from '../services/gemini.js';
import { getPaymentStore } from '../utils/paymentStore.js';
import { assertPaymentTokenValid } from '../services/payment.js';
import { consumeFreeQuota, hasFreeQuota } from '../services/freeQuota.js';
import { PAYMENT_MODE } from '../utils/env.js';
import { StyleIdSchema } from '../constants/styles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const GridBodySchema = z.object({
  characterDNA: z.string().min(1),
  prompts: z.array(z.object({ prompt: z.string().min(1) })).length(4),
  style: StyleIdSchema,
  referenceImage: z.string().min(1),
  isSlave: z.boolean().optional()
});

router.post(
  '/generate-sticker-grid',
  asyncHandler(async (req, res) => {
    const parsed = GridBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(fail('BAD_REQUEST', '参数错误', parsed.error.flatten()));
      return;
    }

    const store = await getPaymentStore();
    const userId = req.userId!;

    // Check payment/quota based on mode
    if (PAYMENT_MODE === 'free') {
      // Free mode: check daily quota
      const hasQuota = await hasFreeQuota(store, userId);
      if (!hasQuota) {
        res.status(402).json(
          fail('QUOTA_EXCEEDED', '今日免费次数已用完，请明天再来', {
            mode: 'free',
            suggestion: '升级到付费版可无限生成'
          })
        );
        return;
      }

      // Consume quota atomically
      const consumed = await consumeFreeQuota(store, userId);
      if (!consumed) {
        res.status(402).json(fail('QUOTA_EXCEEDED', '今日免费次数已用完'));
        return;
      }
    } else {
      // Paid mode: check payment token
      const token = req.header('x-payment-token') || '';
      if (!token) {
        res.status(402).json(fail('PAYMENT_REQUIRED', '请先完成支付', { paymentUrl: '/payment?count=4' }));
        return;
      }

      // Atomic consume during validation to prevent race condition
      const check = await assertPaymentTokenValid(store, token, userId, true);
      if (!check.ok) {
        res.status(402).json(fail(check.error, check.message, { paymentUrl: '/payment?count=4' }));
        return;
      }
    }

    const { characterDNA, prompts, style, referenceImage } = parsed.data;
    const isSlaveBatch = Boolean(parsed.data.isSlave);

    const gridImage = await generateStickerGrid({
      referenceImageBase64: referenceImage,
      characterDescription: characterDNA,
      prompts: prompts.map((p) => p.prompt),
      styleId: style,
      isSlaveBatch
    });

    res.json(ok({ gridImage }));
  })
);

const ImageBodySchema = z.object({
  characterDNA: z.string().min(1),
  prompt: z.string().min(1),
  style: StyleIdSchema,
  referenceImage: z.string().min(1)
});

router.post(
  '/generate-sticker-image',
  asyncHandler(async (req, res) => {
    const parsed = ImageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(fail('BAD_REQUEST', '参数错误', parsed.error.flatten()));
      return;
    }

    const store = await getPaymentStore();
    const userId = req.userId!;

    // Check payment/quota based on mode (same as grid generation)
    if (PAYMENT_MODE === 'free') {
      const hasQuota = await hasFreeQuota(store, userId);
      if (!hasQuota) {
        res.status(402).json(
          fail('QUOTA_EXCEEDED', '今日免费次数已用完，请明天再来', {
            mode: 'free',
            suggestion: '升级到付费版可无限生成'
          })
        );
        return;
      }

      const consumed = await consumeFreeQuota(store, userId);
      if (!consumed) {
        res.status(402).json(fail('QUOTA_EXCEEDED', '今日免费次数已用完'));
        return;
      }
    } else {
      const token = req.header('x-payment-token') || '';
      if (!token) {
        res.status(402).json(fail('PAYMENT_REQUIRED', '请先完成支付', { paymentUrl: '/payment?count=4' }));
        return;
      }

      const check = await assertPaymentTokenValid(store, token, userId);
      if (!check.ok) {
        res.status(402).json(fail(check.error, check.message, { paymentUrl: '/payment?count=4' }));
        return;
      }
    }

    const { characterDNA, prompt, style, referenceImage } = parsed.data;
    const image = await generateStickerImage({
      referenceImageBase64: referenceImage,
      characterDescription: characterDNA,
      promptDetail: prompt,
      styleId: style
    });

    res.json(ok({ image }));
  })
);

export default router;
