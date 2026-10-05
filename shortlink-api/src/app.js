const express = require('express');
const { createRouter } = require('./routes');

function createApp(repo, baseUrl = 'http://localhost:3000') {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(requestLogger);
  app.use(createRouter(repo, baseUrl));

  // Anything that matched no route (e.g. POST /health) -> JSON 404.
  app.use((req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  // Central error handler: log it, never leak a stack trace.
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      return res.status(500).json({ error: 'internal error' });
    }
    return res.status(status).json({ error: 'bad request' });
  });

  return app;
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}

module.exports = { createApp };
