// Standardized API error. Every error response leaves the API as
// { error: { code, message } } so clients can branch on stable codes.
class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const errors = {
  validation: (message) => new ApiError(400, 'VALIDATION_ERROR', message),
  aliasTaken: () =>
    new ApiError(409, 'ALIAS_TAKEN', 'alias already in use'),
  collectionNotFound: () =>
    new ApiError(404, 'COLLECTION_NOT_FOUND', 'The requested collection does not exist.'),
  collectionExists: (name) =>
    new ApiError(409, 'COLLECTION_EXISTS', `a collection named "${name}" already exists`),
  linkNotFound: () =>
    new ApiError(404, 'LINK_NOT_FOUND', 'The requested link does not exist.'),
  linkExpired: () =>
    new ApiError(410, 'LINK_EXPIRED', 'This link has expired.'),
  linkDisabled: () =>
    new ApiError(410, 'LINK_DISABLED', 'This link has been disabled.'),
  rateLimited: (retryAfterSeconds) =>
    new ApiError(429, 'RATE_LIMITED', `Too many requests. Try again in ${retryAfterSeconds}s.`),
  internal: () =>
    new ApiError(500, 'INTERNAL', 'internal error'),
}

module.exports = { ApiError, errors }
