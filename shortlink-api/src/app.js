// createApp(services, options) -> Express app. No listen() here so tests can
// use supertest. options.rateLimit overrides the env-derived limiter config
// (used by tests); options.corsOrigins enables cross-origin browser access.
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const { errorHandler } = require('./middleware/error-handler')
const { requestLogger } = require('./middleware/request-logger')
const { buildLimiters } = require('./middleware/rate-limits')
const { openapiDocument } = require('./docs/openapi')
const { createLinksRouter } = require('./routes/links.routes')
const { createCollectionsRouter } = require('./routes/collections.routes')
const { createAuditRouter } = require('./routes/audit.routes')
const { createHealthRouter } = require('./routes/health.routes')

function createApp(services, options = {}) {
  const app = express()
  app.disable('x-powered-by')
  // Trust one proxy hop so req.ip is the client IP behind the future ALB.
  app.set('trust proxy', 1)

  app.use(helmet())
  if (options.corsOrigins?.length) {
    app.use(cors({ origin: options.corsOrigins }))
  }
  app.use(express.json({ limit: '10kb' }))
  app.use(requestLogger)

  const limiters = buildLimiters(
    options.rateLimit || {
      enabled: true,
      windowMs: 60_000,
      createMax: 30,
      redirectMax: 240,
      apiMax: 300,
    }
  )

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))

  app.get('/', (_req, res) => {
    res.json({ name: 'shortlink-api', status: 'running' })
  })

  app.use('/api', limiters.api, createLinksRouter(services, { createLimiter: limiters.create }))
  app.use('/api', createCollectionsRouter(services))
  app.use('/api', createAuditRouter(services))

  app.use(createHealthRouter(services.ping))

  // Kept last so it can never shadow /api/*, /health or /ready.
  app.use('/:code', limiters.redirect, async (req, res, next) => {
    try {
      const { url } = await services.links.resolve(req.params.code, {
        referer: req.get('referer'),
        userAgent: req.get('user-agent'),
      })
      res.redirect(302, url)
    } catch (err) {
      next(err)
    }
  })

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'not found' } })
  })
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
