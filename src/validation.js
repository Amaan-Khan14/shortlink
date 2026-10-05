// Client-side checks mirroring the backend rules (shortlink-api/src/code.js).
// They exist only for friendly early feedback; the backend re-validates.

const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/
const RESERVED_ALIASES = ['api', 'health']

export const MAX_URL_LENGTH = 2048

// Returns null when valid, an error message string when invalid.
export function validateUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') return 'Enter a URL.'
  if (url.length > MAX_URL_LENGTH) {
    return 'URL is too long (at most 2048 characters).'
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return 'Enter a valid URL.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'URL must start with http:// or https://.'
  }
  return null
}

// The alias is optional: undefined or '' is always valid.
export function validateAlias(alias) {
  if (alias === undefined || alias === '') return null
  if (!ALIAS_PATTERN.test(alias)) {
    return 'Use 3-32 characters: letters, numbers, underscores or hyphens.'
  }
  if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
    return 'That alias is reserved.'
  }
  return null
}
