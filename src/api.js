// Thin fetch wrapper over the shortlink-api backend. The base URL is empty by
// default so requests go to relative /api/... paths (dev proxy or same-domain
// deployment); set VITE_API_BASE_URL only if the API lives on another origin.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network error')
    this.name = 'NetworkError'
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, options)
  } catch {
    throw new NetworkError()
  }
  if (!response.ok) {
    let message = `Request failed (status ${response.status})`
    try {
      const body = await response.json()
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      // Non-JSON error body: keep the default message.
    }
    throw new ApiError(response.status, message)
  }
  return response.json()
}

export function listLinks() {
  return request('/api/links')
}

export function createLink({ url, alias }) {
  const body = { url }
  if (alias) body.alias = alias
  return request('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getHealth() {
  return request('/health')
}
