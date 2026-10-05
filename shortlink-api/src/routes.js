const express = require('express');
const { generateCode, isValidUrl, isValidAlias } = require('./code');

const CODE_GENERATION_ATTEMPTS = 5;

function toDto(row, baseUrl) {
  return {
    code: row.code,
    url: row.url,
    shortUrl: `${baseUrl}/${row.code}`,
    clicks: Number(row.clicks), // pg returns BIGINT as a string
    createdAt: row.created_at.toISOString(),
  };
}

function createRouter(repo, baseUrl) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ name: 'shortlink-api', status: 'running' });
  });

  router.get('/health', async (req, res) => {
    try {
      await repo.ping();
      res.status(200).json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'unhealthy', database: 'down' });
    }
  });

  router.post('/api/links', async (req, res, next) => {
    try {
      const body = req.body || {};
      const { url, alias } = body;

      if (!isValidUrl(url)) {
        return res.status(400).json({
          error: 'url is required and must be a valid http(s) URL of at most 2048 characters',
        });
      }
      if (alias !== undefined && !isValidAlias(alias)) {
        return res.status(400).json({
          error: 'alias must be 3-32 characters of A-Z, a-z, 0-9, _ or - and must not be reserved',
        });
      }

      if (alias !== undefined) {
        let row;
        try {
          row = await repo.createLink({ code: alias, url });
        } catch (err) {
          if (err.code === 'DUPLICATE_CODE') {
            return res.status(409).json({ error: 'alias already in use' });
          }
          throw err;
        }
        return res.status(201).json(toDto(row, baseUrl));
      }

      for (let i = 0; i < CODE_GENERATION_ATTEMPTS; i++) {
        const code = generateCode();
        try {
          const row = await repo.createLink({ code, url });
          return res.status(201).json(toDto(row, baseUrl));
        } catch (err) {
          if (err.code !== 'DUPLICATE_CODE') throw err;
        }
      }
      return res.status(500).json({ error: 'could not generate a unique code' });
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/links', async (req, res, next) => {
    try {
      const rows = await repo.listLinks();
      res.json(rows.map((row) => toDto(row, baseUrl)));
    } catch (err) {
      next(err);
    }
  });

  // Kept last so it can never shadow /api/* or /health.
  router.get('/:code', async (req, res, next) => {
    try {
      const row = await repo.incrementClicks(req.params.code);
      if (!row) return res.status(404).json({ error: 'not found' });
      res.redirect(302, row.url);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createRouter };
