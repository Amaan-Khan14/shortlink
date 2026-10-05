// One log line per request: method, path, status, duration in ms.
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`)
  })
  next()
}

module.exports = { requestLogger }
