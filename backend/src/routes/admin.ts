import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import { getUniqueDeviceCount, getDailyStats, getAggregatedStats } from '../services/usageMetrics.js';
import { ok, fail } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

// Get overall unique device count
router.get(
  '/usage',
  asyncHandler(async (_req, res) => {
    const uniqueDevices = await getUniqueDeviceCount();
    res.json(ok({ uniqueDevices }));
  })
);

// Get detailed statistics
// Query params:
//   - start: YYYY-MM-DD (default: 30 days ago)
//   - end: YYYY-MM-DD (default: today)
//   - period: day|week|month (default: day)
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || 'day';

    if (!['day', 'week', 'month'].includes(period)) {
      return res.status(400).json(fail('INVALID_PERIOD', 'Period must be day, week, or month'));
    }

    // Default to last 30 days
    const end = req.query.end as string || new Date().toISOString().split('T')[0];
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    const start = req.query.start as string || defaultStart.toISOString().split('T')[0];

    const stats = await getAggregatedStats(start, end, period as 'day' | 'week' | 'month');

    res.json(ok({
      period,
      start,
      end,
      stats
    }));
  })
);

export default router;

