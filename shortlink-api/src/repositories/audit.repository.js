// Audit trail SQL. Management operations append events; nothing ever
// updates or deletes them. Failures here must not fail the request itself.
function createAuditRepository(pool) {
  async function record({ type, resourceType, resourceId, metadata = {} }) {
    await pool.query(
      `INSERT INTO audit_logs (event_type, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [type, resourceType, resourceId ?? null, JSON.stringify(metadata)]
    )
  }

  async function listRecent(limit = 50) {
    const { rows } = await pool.query(
      `SELECT id, event_type, resource_type, resource_id, metadata, created_at
       FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT $1`,
      [limit]
    )
    return rows
  }

  return { record, listRecent }
}

module.exports = { createAuditRepository }
