// Short code generation and validation helpers.
const crypto = require('crypto');

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const RESERVED_ALIASES = ['api', 'health'];

// Generates a random base62 code using crypto.randomInt (never Math.random,
// which is not cryptographically unpredictable).
function generateCode(length = 7) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

function isValidUrl(url) {
  if (typeof url !== 'string' || url.length > 2048) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

function isValidAlias(alias) {
  return (
    typeof alias === 'string' &&
    ALIAS_PATTERN.test(alias) &&
    !RESERVED_ALIASES.includes(alias.toLowerCase())
  );
}

module.exports = { generateCode, isValidUrl, isValidAlias };
