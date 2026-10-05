// Entrypoint: config, pool, repositories, services, listen, graceful shutdown.
const { Pool } = require('pg')
const { loadConfig } = require('./config')
const { createServices, createRepositories } = require('./services')
const { createApp } = require('./app')

const config = loadConfig()

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
})

const services = createServices({
  ...createRepositories(pool),
  ping: async () => {
    await pool.query('SELECT 1')
  },
  baseUrl: config.baseUrl,
  analyticsMaxDays: config.analyticsMaxDays,
})

const app = createApp(services, {
  rateLimit: config.rateLimit,
  corsOrigins: config.corsOrigins,
})

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`shortlink-api listening on 0.0.0.0:${config.port}`)
})

async function shutdown(signal) {
  console.log(`${signal} received: shutting down`)
  server.close(() => console.log('HTTP server closed'))
  try {
    await pool.end()
    console.log('connection pool closed')
    process.exit(0)
  } catch (err) {
    console.error('error closing pool:', err.message)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
