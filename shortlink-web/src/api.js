// Thin fetch wrapper over the shortlink-api backend. The base URL is empty by
// default so requests go to relative /api/... paths (dev proxy or same-domain
// deployment); set VITE_API_BASE_URL only if the API lives on another origin.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network error')
    this.name = 'NetworkError'
  }
}

// Error bodies are { error: { code, message } }; stay tolerant of plain strings.
function extractMessage(body) {
  if (body?.error) {
    return typeof body.error === 'string' ? body.error : body.error.message
  }
  return undefined
}

function extractCode(body) {
  return body?.error && typeof body.error === 'object' ? body.error.code : undefined
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, options)
  } catch {
    throw new NetworkError()
  }
  if (!response.ok) {
    let body
    let message = `Request failed (status ${response.status})`
    try {
      body = await response.json()
      message = extractMessage(body) ?? message
    } catch {
      // Non-JSON error body: keep the default message.
    }
    throw new ApiError(response.status, extractCode(body), message)
  }
  if (response.status === 204) return null
  return response.json()
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function listLinks() {
  return request('/api/links')
}

export function createLink({ url, alias, expiresAt, collection }) {
  const body = { url }
  if (alias) body.alias = alias
  if (expiresAt) body.expiresAt = expiresAt
  if (collection) body.collection = collection
  return post('/api/links', body)
}

export function getLink(code) {
  return request(`/api/links/${encodeURIComponent(code)}`)
}

export function updateLink(code, patch) {
  return request(`/api/links/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export function deleteLink(code) {
  return request(`/api/links/${encodeURIComponent(code)}`, { method: 'DELETE' })
}

export function getAnalytics(code, days = 30) {
  return request(
    `/api/links/${encodeURIComponent(code)}/analytics?days=${encodeURIComponent(days)}`
  )
}

export function listCollections() {
  return request('/api/collections')
}

export function createCollection(name) {
  return post('/api/collections', { name })
}

export function getHealth() {
  return request('/health')
}
