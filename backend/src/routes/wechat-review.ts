import { Router } from 'express';
import { z } from 'zod';
import { fail, ok } from '../utils/http.js';
import {
  generateReviewBanner,
  generateReviewCover,
  generateReviewIcon
} from '../services/gemini.js';
import { getPaymentStore } from '../utils/paymentStore.js';
import { assertPaymentTokenValid } from '../services/payment.js';
import { consumeFreeQuota, hasFreeQuota, checkIpDeviceLimit, refundFreeQuota } from '../services/freeQuota.js';
import { PAYMENT_MODE } from '../utils/env.js';
import { StyleIdSchema } from '../constants/styles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { log } from '../utils/logger.js';

const router = Router();

// 请求体验证 Schema
const ReviewAssetBodySchema = z.object({
  characterDNA: z.string().min(1),
  referenceImage: z.string().min(1),
  style: StyleIdSchema.optional().default('popart')
});

/**
 * 一键生成所有审核资源（横幅、封面、图标）
 * POST /api/generate-review-assets
 */
router.post(
  '/generate-review-assets',
  asyncHandler(async (req, res) => {
    const parsed = ReviewAssetBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(fail('BAD_REQUEST', '参数错误', parsed.error.flatten()));
      return;
    }

    const store = await getPaymentStore();
    const userId = req.userId!;
    const ip = req.ip || 'unknown';
    const deviceId = req.deviceId || '';

    // IP 防刷检测
    const ipCheck = await checkIpDeviceLimit(ip, deviceId);
    if (!ipCheck.allowed) {
      res.status(429).json(
        fail('IP_DEVICE_LIMIT', '该IP访问设备数过多，请明日再试', {
          deviceCount: ipCheck.deviceCount,
          suggestion: '如有疑问请联系客服'
        })
      );
      return;
    }

    // 配额/支付检查
    let quotaConsumed = false;
    if (PAYMENT_MODE === 'free') {
      // 免费模式：检查配额
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

      // 消耗配额
      const consumed = await consumeFreeQuota(store, userId);
      if (!consumed) {
        res.status(402).json(fail('QUOTA_EXCEEDED', '今日免费次数已用完'));
        return;
      }

      quotaConsumed = true;
      log.info(`[WeChatReview] Free quota consumed for user ${userId} (IP: ${ip})`);
    } else {
      // 付费模式：验证支付令牌
      const token = req.header('x-payment-token') || '';
      if (!token) {
        res.status(402).json(fail('PAYMENT_REQUIRED', '请先完成支付'));
        return;
      }

      const check = await assertPaymentTokenValid(store, token, userId, true);
      if (!check.ok) {
        res.status(402).json(fail('PAYMENT_INVALID', check.message || '支付令牌无效'));
        return;
      }

      log.info(`[WeChatReview] Payment token validated for user ${userId}`);
    }

    const { characterDNA, referenceImage, style } = parsed.data;
    let step: 'banner' | 'cover' | 'icon' | 'unknown' = 'unknown';

    try {
      log.info(`[WeChatReview] Starting review assets generation (style: ${style})`);

      // 依次生成三种资源
      step = 'banner';
      const banner = await generateReviewBanner({
        referenceImageBase64: referenceImage,
        characterDescription: characterDNA,
        styleId: style
      });

      step = 'cover';
      const cover = await generateReviewCover({
        referenceImageBase64: referenceImage,
        characterDescription: characterDNA,
        styleId: style
      });

      step = 'icon';
      const icon = await generateReviewIcon({
        referenceImageBase64: referenceImage,
        characterDescription: characterDNA,
        styleId: style
      });

      log.info(`[WeChatReview] Successfully generated all review assets`);

      res.json(
        ok({
          banner,
          cover,
          icon,
          metadata: {
            generatedAt: new Date().toISOString(),
            style
          }
        })
      );
    } catch (error: any) {
      if (quotaConsumed) {
        await refundFreeQuota(store, userId);
        log.info(`[WeChatReview] Refunded free quota for user ${userId}`);
      }

      const status = error?.status || error?.code || 'unknown';
      log.error(
        `[WeChatReview] Generation failed (${status}): ${error?.message || 'Unknown error'}`
      );
      res.status(500).json(
        fail(
          'GENERATION_FAILED',
          '审核资源生成失败，请重试',
          {
            step: typeof step === 'string' ? step : 'unknown',
            errorDetails: error?.message || 'Unknown error',
            status
          }
        )
      );
    }
  })
);

export default router;
