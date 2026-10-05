// Reads and validates environment variables. All configuration lives in env
// vars so the exact same code runs on a laptop and on AWS later.

function loadConfig(env = process.env) {
  const port = parseInt(env.PORT, 10) || 3000;

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL to your Postgres connection string.'
    );
    process.exit(1);
  }

  return {
    port,
    databaseUrl,
    ssl: env.DB_SSL === 'true',
    baseUrl: env.BASE_URL || `http://localhost:${port}`,
  };
}

module.exports = { loadConfig };
