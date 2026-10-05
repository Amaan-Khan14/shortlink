// Link management business logic. HTTP concerns stay in routes/; SQL stays in
// repositories/. Validation mirrors the rules documented in the OpenAPI spec.
const { generateCode, isValidUrl, isValidAlias } = require('../utils/code')
const { toLinkDto } = require('../utils/dto')
const { errors } = require('../utils/errors')
const { parseUserAgent, normalizeReferrer } = require('../utils/user-agent')

const CODE_GENERATION_ATTEMPTS = 5
const COLLECTION_NAME_MAX = 64

function createLinksService({ linksRepo, eventsRepo, collectionsRepo, auditRepo, baseUrl }) {
  function audit(type, code, metadata) {
    // Fire-and-forget: an audit failure must not fail the management request.
    auditRepo.record({ type, resourceType: 'link', resourceId: code, metadata })
      .catch((err) => console.error('audit write failed:', err.message))
  }

  async function resolveCollectionId(collection) {
    if (collection === undefined || collection === null) return undefined
    const name = String(collection).trim()
    if (name === '') return null // explicit clear
    if (name.length > COLLECTION_NAME_MAX) {
      throw errors.validation(`collection name must be at most ${COLLECTION_NAME_MAX} characters`)
    }
    const found = await collectionsRepo.findOrCreateByName(name)
    return found.id
  }

  function parseExpiresAt(expiresAt) {
    if (expiresAt === undefined) return undefined
    if (expiresAt === null || expiresAt === '') return null // explicit clear
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) {
      throw errors.validation('expiresAt must be a valid ISO 8601 date')
    }
    return date
  }

  async function createLink({ url, alias, expiresAt, collection }) {
    if (!isValidUrl(url)) {
      throw errors.validation('url is required and must be a valid http(s) URL of at most 2048 characters')
    }
    if (alias !== undefined && !isValidAlias(alias)) {
      throw errors.validation('alias must be 3-32 characters of A-Z, a-z, 0-9, _ or - and must not be reserved')
    }
    const parsedExpiry = parseExpiresAt(expiresAt)
    const collectionId = await resolveCollectionId(collection)

    if (alias !== undefined) {
      let row
      try {
        row = await linksRepo.createLink({ code: alias, url, expiresAt: parsedExpiry, collectionId })
      } catch (err) {
        if (err.code === 'DUPLICATE_CODE') throw errors.aliasTaken()
        throw err
      }
      audit('link.created', row.code, { alias: true })
      return toLinkDto(row, baseUrl)
    }

    for (let i = 0; i < CODE_GENERATION_ATTEMPTS; i++) {
      const code = generateCode()
      try {
        const row = await linksRepo.createLink({ code, url, expiresAt: parsedExpiry, collectionId })
        audit('link.created', row.code, { alias: false })
        return toLinkDto(row, baseUrl)
      } catch (err) {
        if (err.code !== 'DUPLICATE_CODE') throw err
      }
    }
    throw errors.internal()
  }

  async function getLink(code) {
    const row = await linksRepo.getLinkByCode(code)
    if (!row) throw errors.linkNotFound()
    return toLinkDto(row, baseUrl)
  }

  async function listLinks() {
    const rows = await linksRepo.listLinks(50)
    return rows.map((row) => toLinkDto(row, baseUrl))
  }

  async function updateLink(code, patch) {
    const fields = {}
    if (patch.url !== undefined) {
      if (!isValidUrl(patch.url)) {
        throw errors.validation('url must be a valid http(s) URL of at most 2048 characters')
      }
      fields.url = patch.url
    }
    if (patch.expiresAt !== undefined) {
      fields.expiresAt = parseExpiresAt(patch.expiresAt)
    }
    if (patch.isEnabled !== undefined) {
      if (typeof patch.isEnabled !== 'boolean') {
        throw errors.validation('isEnabled must be a boolean')
      }
      fields.isEnabled = patch.isEnabled
    }
    if (patch.collection !== undefined) {
      fields.collectionId = await resolveCollectionId(patch.collection)
    }

    const row = await linksRepo.updateLink(code, fields)
    if (!row) throw errors.linkNotFound()

    const changed = Object.keys(fields).filter((k) => k !== 'collectionId')
    if (fields.isEnabled !== undefined) {
      audit(fields.isEnabled ? 'link.enabled' : 'link.disabled', code)
    }
    const semanticChanges = changed.filter((k) => k !== 'isEnabled')
    if (semanticChanges.length > 0 || fields.collectionId !== undefined) {
      audit('link.updated', code, { fields: semanticChanges })
    }
    return toLinkDto(row, baseUrl)
  }

  async function deleteLink(code) {
    const deleted = await linksRepo.deleteLink(code)
    if (!deleted) throw errors.linkNotFound()
    audit('link.deleted', code)
  }

  // Redirect hot path. One transactional call; classification of
  // not-found / expired / disabled happens inside the repository.
  async function resolve(code, { referer, userAgent }) {
    const event = {
      ...parseUserAgent(userAgent),
      referrer: normalizeReferrer(referer),
    }
    const result = await eventsRepo.recordClick(code, event)
    if (result.status === 'ok') return { url: result.url }
    if (result.status === 'expired') throw errors.linkExpired()
    if (result.status === 'disabled') throw errors.linkDisabled()
    throw errors.linkNotFound()
  }

  return { createLink, getLink, listLinks, updateLink, deleteLink, resolve }
}

module.exports = { createLinksService }
