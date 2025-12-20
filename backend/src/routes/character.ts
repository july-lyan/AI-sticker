import { Router } from 'express';
import { z } from 'zod';
import { analyzeCharacter } from '../services/gemini.js';
import { fail, ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const BodySchema = z.object({
  referenceImage: z.string().min(1),
  category: z.string().min(1)
});

router.post(
  '/analyze-character',
  asyncHandler(async (req, res) => {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(fail('BAD_REQUEST', '参数错误', parsed.error.flatten()));
      return;
    }

    const characterDNA = await analyzeCharacter({
      referenceImageBase64: parsed.data.referenceImage,
      userCategoryLabel: parsed.data.category
    });

    res.json(ok({ characterDNA }));
  })
);

export default router;
