// Health (liveness + DB check, used by the future load balancer) and
// readiness. Both stay cheap: a single SELECT 1.
const express = require('express')

function createHealthRouter(ping) {
  const router = express.Router()

  router.get('/health', async (_req, res) => {
    try {
      await ping()
      res.status(200).json({ status: 'ok', database: 'up' })
    } catch {
      res.status(503).json({ status: 'unhealthy', database: 'down' })
    }
  })

  router.get('/ready', async (_req, res) => {
    try {
      await ping()
      res.status(200).json({
        status: 'ready',
        checks: { database: 'up' },
        uptimeSeconds: Math.floor(process.uptime()),
      })
    } catch {
      res.status(503).json({
        status: 'not ready',
        checks: { database: 'down' },
        uptimeSeconds: Math.floor(process.uptime()),
      })
    }
  })

  return router
}

module.exports = { createHealthRouter }
