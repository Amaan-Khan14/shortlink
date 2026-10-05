// Collections SQL. A link belongs to at most one collection (nullable FK,
// SET NULL on delete), which keeps grouping lightweight.
function createCollectionsRepository(pool) {
  async function listCollections() {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.created_at, count(l.id)::int AS link_count
       FROM collections c
       LEFT JOIN links l ON l.collection_id = c.id
       GROUP BY c.id, c.name, c.created_at
       ORDER BY c.name ASC`
    )
    return rows
  }

  async function createCollection(name) {
    const { rows } = await pool.query(
      `INSERT INTO collections (name) VALUES ($1)
       RETURNING id, name, created_at`,
      [name]
    )
    return rows[0]
  }

  async function findByName(name) {
    const { rows } = await pool.query('SELECT id, name FROM collections WHERE name = $1', [name])
    return rows[0] ?? null
  }

  async function deleteCollection(id) {
    const { rowCount } = await pool.query('DELETE FROM collections WHERE id = $1', [id])
    return rowCount > 0
  }

  async function findOrCreateByName(name) {
    const existing = await findByName(name)
    if (existing) return existing
    try {
      return await createCollection(name)
    } catch (err) {
      if (err.code === '23505') return findByName(name) // concurrent create
      throw err
    }
  }

  return { listCollections, createCollection, findByName, deleteCollection, findOrCreateByName }
}

module.exports = { createCollectionsRepository }
