import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import {
  enhanceEntry,
  locationInsights,
  captionPhoto,
  compileTrip,
  analyseSentiment,
  nlSearch,
} from '../controllers/aiController.js';

const router = Router();

router.use(protect, aiRateLimit);

router.post('/enhance-entry',      enhanceEntry);
router.post('/location-insights',  locationInsights);
router.post('/caption-photo',      captionPhoto);
router.post('/compile-trip',       compileTrip);
router.post('/analyse-sentiment',  analyseSentiment);
router.post('/nl-search',          nlSearch);

export default router;
