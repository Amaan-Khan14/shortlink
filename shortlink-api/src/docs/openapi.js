// OpenAPI 3.0 document served by swagger-ui-express at /api/docs.
// Kept as a JS object so no YAML parser dependency is needed.
const newError = (code, message) => ({
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: { code: { type: 'string', example: code }, message: { type: 'string', example: message } },
      required: ['code', 'message'],
    },
  },
  required: ['error'],
})

const linkSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', example: 'aB3xY9z' },
    url: { type: 'string', example: 'https://example.com/very/long/path' },
    shortUrl: { type: 'string', example: 'http://localhost:3000/aB3xY9z' },
    clicks: { type: 'integer', example: 42 },
    createdAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    isEnabled: { type: 'boolean', example: true },
    collection: {
      type: 'object',
      nullable: true,
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
    },
  },
  required: ['code', 'url', 'shortUrl', 'clicks', 'createdAt', 'isEnabled'],
}

const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ShortLink API',
    version: '1.0.0',
    description:
      'URL management and analytics platform. Links support expiration, enable/disable, collections, and per-click analytics. All error responses use { error: { code, message } }.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'local' }],
  paths: {
    '/api/links': {
      post: {
        summary: 'Create a short link',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', maxLength: 2048, example: 'https://example.com' },
                  alias: { type: 'string', pattern: '^[A-Za-z0-9_-]{3,32}$', example: 'launch-2026' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  collection: { type: 'string', maxLength: 64, example: 'AWS Workshop' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: linkSchema } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: newError('VALIDATION_ERROR', 'url is required') } } },
          409: { description: 'Alias taken', content: { 'application/json': { schema: newError('ALIAS_TAKEN', 'alias already in use') } } },
          429: { description: 'Rate limited', content: { 'application/json': { schema: newError('RATE_LIMITED', 'Too many requests') } } },
        },
      },
      get: {
        summary: 'List links (newest first, max 50)',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: linkSchema } } } },
        },
      },
    },
    '/api/links/{code}': {
      parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
      get: { summary: 'Link details', responses: { 200: { description: 'OK', content: { 'application/json': { schema: linkSchema } } }, 404: { description: 'Not found', content: { 'application/json': { schema: newError('LINK_NOT_FOUND', 'The requested link does not exist.') } } } } },
      patch: {
        summary: 'Update a link (url, expiresAt, isEnabled, collection)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  isEnabled: { type: 'boolean' },
                  collection: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: linkSchema } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: newError('VALIDATION_ERROR', 'url must be valid') } } },
          404: { description: 'Not found', content: { 'application/json': { schema: newError('LINK_NOT_FOUND', 'The requested link does not exist.') } } },
        },
      },
      delete: { summary: 'Delete a link', responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found', content: { 'application/json': { schema: newError('LINK_NOT_FOUND', 'The requested link does not exist.') } } } } },
    },
    '/api/links/{code}/analytics': {
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'days', in: 'query', schema: { type: 'integer', default: 30, maximum: 90 } },
      ],
      get: {
        summary: 'Click analytics for a link',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    days: { type: 'integer' },
                    totals: { type: 'object', properties: { clicks: { type: 'integer' }, recorded: { type: 'integer' }, today: { type: 'integer' }, week: { type: 'integer' } } },
                    timeline: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, clicks: { type: 'integer' } } } },
                    referrers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, clicks: { type: 'integer' } } } },
                    devices: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, clicks: { type: 'integer' } } } },
                    browsers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, clicks: { type: 'integer' } } } },
                    operatingSystems: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, clicks: { type: 'integer' } } } },
                  },
                },
              },
            },
          },
          404: { description: 'Not found', content: { 'application/json': { schema: newError('LINK_NOT_FOUND', 'The requested link does not exist.') } } },
        },
      },
    },
    '/{code}': {
      parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        summary: 'Redirect (records a click with referrer/UA analytics)',
        responses: {
          302: { description: 'Redirect to the original URL' },
          404: { description: 'Unknown code', content: { 'application/json': { schema: newError('LINK_NOT_FOUND', 'The requested link does not exist.') } } },
          410: { description: 'Expired or disabled', content: { 'application/json': { schema: newError('LINK_EXPIRED', 'This link has expired.') } } },
        },
      },
    },
    '/api/collections': {
      get: { summary: 'List collections with link counts', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, linkCount: { type: 'integer' } } } } } } } },
      post: {
        summary: 'Create a collection',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', maxLength: 64 } } } } } },
        responses: { 201: { description: 'Created' }, 400: { description: 'Validation error', content: { 'application/json': { schema: newError('VALIDATION_ERROR', 'collection name must be 1-64 characters') } } }, 409: { description: 'Exists', content: { 'application/json': { schema: newError('COLLECTION_EXISTS', 'a collection named "x" already exists') } } } },
      },
    },
    '/api/collections/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      delete: { summary: 'Delete a collection (links detach, not deleted)', responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found', content: { 'application/json': { schema: newError('COLLECTION_NOT_FOUND', 'The requested collection does not exist.') } } } } },
    },
    '/api/audit': {
      get: {
        summary: 'Recent audit events (link/collection management operations)',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/health': { get: { summary: 'Health (checks DB; for load balancer checks)', responses: { 200: { description: 'OK' }, 503: { description: 'Unhealthy' } } } },
    '/ready': { get: { summary: 'Readiness (DB check + uptime)', responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } } } },
  },
  },
}

module.exports = { openapiDocument }
