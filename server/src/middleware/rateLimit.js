import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() ?? ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests — please wait a minute and try again.' },
});
