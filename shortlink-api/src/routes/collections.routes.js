// Collection routes: list, create, delete.
const express = require('express')

function createCollectionsRouter(services) {
  const router = express.Router()

  router.get('/collections', async (req, res, next) => {
    try {
      res.json(await services.collections.listCollections())
    } catch (err) {
      next(err)
    }
  })

  router.post('/collections', async (req, res, next) => {
    try {
      const collection = await services.collections.createCollection((req.body || {}).name)
      res.status(201).json(collection)
    } catch (err) {
      next(err)
    }
  })

  router.delete('/collections/:id', async (req, res, next) => {
    try {
      await services.collections.deleteCollection(Number(req.params.id))
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}

module.exports = { createCollectionsRouter }
