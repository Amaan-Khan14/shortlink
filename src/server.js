const { Pool } = require('pg');
const { loadConfig } = require('./config');
const { createRepo } = require('./repo');
const { createApp } = require('./app');

const config = loadConfig();

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
});

const repo = createRepo(pool);
const app = createApp(repo, config.baseUrl);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`shortlink-api listening on port ${config.port} (${config.baseUrl})`);
});

// Graceful shutdown: stop accepting connections, close the pool, exit 0.
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      console.error('error closing pool:', err);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
