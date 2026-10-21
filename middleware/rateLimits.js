const rateLimit = require('express-rate-limit');

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const message = (text) => ({ success: false, message: text });

/** Brute-force protection for credentials. Successful logins do not count. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: num(process.env.RATE_LIMIT_LOGIN, 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Too many sign-in attempts. Please try again in 15 minutes.'),
});

/**
 * Ceiling for writes per IP. Reads are not limited here: the public website's server-side
 * rendering funnels many visitors through one IP, and reads are served from the cache anyway.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: num(process.env.RATE_LIMIT_WRITES_PER_MINUTE, 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
  message: message('Too many requests. Please slow down.'),
});

/** Expensive endpoints: Bedrock chat and HTML/PDF tree rendering (Puppeteer). */
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: num(process.env.RATE_LIMIT_HEAVY_PER_MINUTE, 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests to this endpoint. Please wait a minute.'),
});

module.exports = { loginLimiter, apiLimiter, heavyLimiter };
