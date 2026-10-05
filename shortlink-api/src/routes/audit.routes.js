// Read-only audit trail.
const express = require('express')

function createAuditRouter(services) {
  const router = express.Router()

  router.get('/audit', async (req, res, next) => {
    try {
      res.json(await services.audit.listRecent(req.query.limit))
    } catch (err) {
      next(err)
    }
  })

  return router
}

module.exports = { createAuditRouter }
