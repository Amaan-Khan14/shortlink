// Shared test helpers: an app over in-memory fakes, mirroring server.js wiring.
const request = require('supertest')
const { createApp } = require('../src/app')
const { createServices } = require('../src/services')
const { createFakeRepos } = require('./fakes')

function makeApp({ rateLimit, healthy = true } = {}) {
  const repos = createFakeRepos({ healthy })
  const services = createServices({
    ...repos,
    baseUrl: 'http://localhost:3000',
    analyticsMaxDays: 90,
  })
  const app = createApp(services, {
    rateLimit: rateLimit || { enabled: false, windowMs: 60_000, createMax: 30, redirectMax: 240, apiMax: 300 },
  })
  return { app, repos, services }
}

module.exports = { makeApp, request }
