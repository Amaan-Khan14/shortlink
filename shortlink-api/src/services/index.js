// Composition root for services. server.js builds repositories from the pg
// pool and passes them here; tests pass in-memory fakes with the same
// interfaces so the real business logic runs without a database.
function createServices({
  linksRepo,
  eventsRepo,
  collectionsRepo,
  auditRepo,
  ping,
  baseUrl = 'http://localhost:3000',
  analyticsMaxDays = 90,
}) {
  const links = require('./links.service').createLinksService({
    linksRepo, eventsRepo, collectionsRepo, auditRepo, baseUrl,
  })
  const analytics = require('./analytics.service').createAnalyticsService({
    eventsRepo, linksRepo, maxDays: analyticsMaxDays,
  })
  const collections = require('./collections.service').createCollectionsService({
    collectionsRepo, auditRepo,
  })
  const audit = require('./audit.service').createAuditService({ auditRepo })

  return { links, analytics, collections, audit, ping }
}

function createRepositories(pool) {
  const { createLinksRepository } = require('../repositories/links.repository')
  const { createEventsRepository } = require('../repositories/events.repository')
  const { createCollectionsRepository } = require('../repositories/collections.repository')
  const { createAuditRepository } = require('../repositories/audit.repository')
  return {
    linksRepo: createLinksRepository(pool),
    eventsRepo: createEventsRepository(pool),
    collectionsRepo: createCollectionsRepository(pool),
    auditRepo: createAuditRepository(pool),
  }
}

module.exports = { createServices, createRepositories }
