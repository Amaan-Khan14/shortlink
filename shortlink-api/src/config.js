// Reads and validates environment variables. No hardcoded secrets.
function intEnv(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    console.error(`Invalid ${name}: "${raw}" must be a non-negative number`)
    process.exit(1)
  }
  return value
}

function boolEnv(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return raw === 'true' || raw === '1'
}

function loadConfig(env = process.env) {
  if (!env.DATABASE_URL) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env and set it to your Postgres URL.'
    )
    process.exit(1)
  }

  const port = intEnv('PORT', 3000)

  return {
    port,
    databaseUrl: env.DATABASE_URL,
    dbSsl: boolEnv('DB_SSL', false),
    baseUrl: env.BASE_URL || `http://localhost:${port}`,
    analyticsMaxDays: intEnv('ANALYTICS_MAX_DAYS', 90),
    corsOrigins: (env.CORS_ORIGIN || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimit: {
      enabled: boolEnv('RATE_LIMIT_ENABLED', true),
      windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60_000),
      createMax: intEnv('RATE_LIMIT_CREATE_MAX', 30),
      redirectMax: intEnv('RATE_LIMIT_REDIRECT_MAX', 240),
      apiMax: intEnv('RATE_LIMIT_API_MAX', 300),
    },
  }
}

module.exports = { loadConfig }
