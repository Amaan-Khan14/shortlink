// ALL links SQL lives here, isolated from HTTP handling so tests can run
// against an in-memory fake (tests/fakes) with no database at all.
const { DUPLICATE_CODE } = require('./pg-errors')

const LINK_SELECT = `
  SELECT l.id, l.code, l.url, l.clicks, l.created_at, l.expires_at,
         l.is_enabled, l.collection_id, c.name AS collection_name
  FROM links l
  LEFT JOIN collections c ON c.id = l.collection_id`

function createLinksRepository(pool) {
  async function createLink({ code, url, expiresAt, collectionId }) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO links (code, url, expires_at, collection_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code, url, clicks, created_at, expires_at, is_enabled, collection_id`,
        [code, url, expiresAt ?? null, collectionId ?? null]
      )
      const row = rows[0]
      if (collectionId) {
        const col = await pool.query('SELECT name FROM collections WHERE id = $1', [collectionId])
        row.collection_name = col.rows[0]?.name ?? null
      }
      return row
    } catch (err) {
      if (err.code === '23505') throw DUPLICATE_CODE()
      throw err
    }
  }

  async function getLinkByCode(code) {
    const { rows } = await pool.query(`${LINK_SELECT} WHERE l.code = $1`, [code])
    return rows[0] ?? null
  }

  async function listLinks(limit = 50, collectionId = null) {
    const params = []
    let where = ''
    if (collectionId) {
      params.push(collectionId)
      where = `WHERE l.collection_id = $${params.length}`
    }
    params.push(limit)
    const { rows } = await pool.query(
      `${LINK_SELECT} ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length}`,
      params
    )
    return rows
  }

  async function updateLink(code, fields) {
    const sets = []
    const params = []
    const add = (column, value) => {
      params.push(value)
      sets.push(`${column} = $${params.length}`)
    }
    if (fields.url !== undefined) add('url', fields.url)
    if (fields.expiresAt !== undefined) add('expires_at', fields.expiresAt)
    if (fields.isEnabled !== undefined) add('is_enabled', fields.isEnabled)
    if (fields.collectionId !== undefined) add('collection_id', fields.collectionId)
    if (sets.length === 0) return getLinkByCode(code)

    params.push(code)
    const { rows } = await pool.query(
      `UPDATE links SET ${sets.join(', ')} WHERE code = $${params.length}
       RETURNING id, code, url, clicks, created_at, expires_at, is_enabled, collection_id`,
      params
    )
    if (rows.length === 0) return null
    const row = rows[0]
    if (row.collection_id) {
      const col = await pool.query('SELECT name FROM collections WHERE id = $1', [row.collection_id])
      row.collection_name = col.rows[0]?.name ?? null
    }
    return row
  }

  async function deleteLink(code) {
    const { rowCount } = await pool.query('DELETE FROM links WHERE code = $1', [code])
    return rowCount > 0
  }

  return { createLink, getLinkByCode, listLinks, updateLink, deleteLink }
}

module.exports = { createLinksRepository }
