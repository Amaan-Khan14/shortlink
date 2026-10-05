// Applies db/schema.sql using the pg library, so participants do not need
// the psql CLI. Run with: npm run db:init
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { loadConfig } = require('../src/config');

async function main() {
  const config = loadConfig();
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query(schema);
    console.log('Schema applied');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
