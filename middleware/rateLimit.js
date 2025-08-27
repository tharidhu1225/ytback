import rateLimit from 'express-rate-limit';

export const infoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: { error: 'Too many video info requests. Slow down!' }
});
