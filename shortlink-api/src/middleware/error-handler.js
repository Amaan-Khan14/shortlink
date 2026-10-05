// Central error handler. ApiErrors carry a stable machine-readable code;
// anything else is logged and hidden behind a generic 500 so stack traces
// and database internals never reach API consumers.
const { ApiError, errors } = require('../utils/errors')

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } })
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    const e = errors.validation('request body must be valid JSON of at most 10kb')
    return res.status(e.status).json({ error: { code: e.code, message: e.message } })
  }
  console.error(err)
  const e = errors.internal()
  return res.status(e.status).json({ error: { code: e.code, message: e.message } })
}

module.exports = { errorHandler }
