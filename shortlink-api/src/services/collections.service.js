// Collections: thin grouping over links. Creating a link with an unknown
// collection name implicitly creates the collection (see links.service).
const { errors } = require('../utils/errors')

const COLLECTION_NAME_MAX = 64

function createCollectionsService({ collectionsRepo, auditRepo }) {
  function audit(type, resourceId, metadata) {
    auditRepo.record({ type, resourceType: 'collection', resourceId, metadata })
      .catch((err) => console.error('audit write failed:', err.message))
  }

  async function listCollections() {
    const rows = await collectionsRepo.listCollections()
    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      createdAt: row.created_at.toISOString(),
      linkCount: row.link_count,
    }))
  }

  async function createCollection(name) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > COLLECTION_NAME_MAX) {
      throw errors.validation(`collection name must be 1-${COLLECTION_NAME_MAX} characters`)
    }
    const existing = await collectionsRepo.findByName(name.trim())
    if (existing) throw errors.collectionExists(name.trim())
    const row = await collectionsRepo.createCollection(name.trim())
    audit('collection.created', String(row.id), { name: row.name })
    return { id: Number(row.id), name: row.name, createdAt: row.created_at.toISOString() }
  }

  async function deleteCollection(id) {
    const deleted = await collectionsRepo.deleteCollection(id)
    if (!deleted) throw errors.collectionNotFound()
    audit('collection.deleted', String(id))
  }

  return { listCollections, createCollection, deleteCollection }
}

module.exports = { createCollectionsService }
