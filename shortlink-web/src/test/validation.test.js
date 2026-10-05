import { describe, test, expect } from 'vitest'
import { validateUrl, validateAlias, MAX_URL_LENGTH } from '@/validation'

describe('validateUrl', () => {
  test('accepts http and https URLs', () => {
    expect(validateUrl('https://example.com')).toBeNull()
    expect(validateUrl('http://example.com/path?q=1')).toBeNull()
  })

  test('rejects an empty or whitespace URL', () => {
    expect(validateUrl('')).not.toBeNull()
    expect(validateUrl('   ')).not.toBeNull()
    expect(validateUrl(undefined)).not.toBeNull()
  })

  test('rejects non-http schemes', () => {
    expect(validateUrl('ftp://example.com/file')).not.toBeNull()
    expect(validateUrl('javascript:alert(1)')).not.toBeNull()
    expect(validateUrl('mailto:someone@example.com')).not.toBeNull()
  })

  test('rejects unparseable input', () => {
    expect(validateUrl('not a url')).not.toBeNull()
    expect(validateUrl('example.com')).not.toBeNull()
  })

  test('rejects URLs over 2048 characters', () => {
    const long = `https://example.com/${'a'.repeat(MAX_URL_LENGTH)}`
    expect(long.length).toBeGreaterThan(MAX_URL_LENGTH)
    expect(validateUrl(long)).not.toBeNull()
  })
})

describe('validateAlias', () => {
  test('accepts a valid alias', () => {
    expect(validateAlias('launch')).toBeNull()
    expect(validateAlias('Launch_2026-x')).toBeNull()
  })

  test('allows an empty alias (the field is optional)', () => {
    expect(validateAlias('')).toBeNull()
    expect(validateAlias(undefined)).toBeNull()
  })

  test('rejects aliases that are too short or too long', () => {
    expect(validateAlias('ab')).not.toBeNull()
    expect(validateAlias('a'.repeat(33))).not.toBeNull()
  })

  test('rejects aliases with invalid characters', () => {
    expect(validateAlias('has space')).not.toBeNull()
    expect(validateAlias('no!')).not.toBeNull()
    expect(validateAlias('dots.not')).not.toBeNull()
  })

  test('rejects reserved words, case-insensitively', () => {
    expect(validateAlias('api')).not.toBeNull()
    expect(validateAlias('health')).not.toBeNull()
    expect(validateAlias('API')).not.toBeNull()
    expect(validateAlias('Health')).not.toBeNull()
  })
})
