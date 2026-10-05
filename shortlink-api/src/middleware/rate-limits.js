// Application-level rate limiting (in-memory, per-IP). Limits are
// configurable through env vars; tests construct the app with tiny limits
// or disable them entirely.
const { rateLimit } = require('express-rate-limit')

function buildLimiters({ enabled, windowMs, createMax, redirectMax, apiMax }) {
  if (!enabled) {
    const pass = (_req, _res, next) => next()
    return { create: pass, redirect: pass, api: pass }
  }

  const make = (max, scope) =>
    rateLimit({
      windowMs,
      limit: max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (req, res) => {
        const retryAfter = Math.ceil(windowMs / 1000)
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests to ${scope}. Try again in ${retryAfter}s.`,
          },
        })
      },
    })

  return {
    create: make(createMax, 'link creation'),
    redirect: make(redirectMax, 'redirects'),
    api: make(apiMax, 'this API'),
  }
}

module.exports = { buildLimiters }
