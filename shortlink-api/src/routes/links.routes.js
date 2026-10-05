// /api/links routes: HTTP concerns only (status codes, request parsing).
// Logic lives in services/links.service.js, SQL in repositories/.
const express = require('express')

function createLinksRouter(services, { createLimiter } = {}) {
  const router = express.Router()

  router.post('/links', createLimiter ?? ((_req, _res, next) => next()), async (req, res, next) => {
    try {
      const body = req.body || {}
      const link = await services.links.createLink({
        url: body.url,
        alias: body.alias,
        expiresAt: body.expiresAt,
        collection: body.collection,
      })
      res.status(201).json(link)
    } catch (err) {
      next(err)
    }
  })

  router.get('/links', async (req, res, next) => {
    try {
      res.json(await services.links.listLinks())
    } catch (err) {
      next(err)
    }
  })

  router.get('/links/:code/analytics', async (req, res, next) => {
    try {
      const result = await services.analytics.getAnalytics(
        req.params.code,
        req.query.days
      )
      if (!result) return res.status(404).json({
        error: { code: 'LINK_NOT_FOUND', message: 'The requested link does not exist.' },
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  router.get('/links/:code', async (req, res, next) => {
    try {
      res.json(await services.links.getLink(req.params.code))
    } catch (err) {
      next(err)
    }
  })

  router.patch('/links/:code', async (req, res, next) => {
    try {
      const body = req.body || {}
      res.json(await services.links.updateLink(req.params.code, {
        url: body.url,
        expiresAt: body.expiresAt,
        isEnabled: body.isEnabled,
        collection: body.collection,
      }))
    } catch (err) {
      next(err)
    }
  })

  router.delete('/links/:code', async (req, res, next) => {
    try {
      await services.links.deleteLink(req.params.code)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}

module.exports = { createLinksRouter }
