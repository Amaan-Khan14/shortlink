// Read-only view over the audit trail.
function createAuditService({ auditRepo }) {
  async function listRecent(limit = 50) {
    const rows = await auditRepo.listRecent(Math.min(Math.max(1, Number(limit) || 50), 200))
    return rows.map((row) => ({
      id: Number(row.id),
      type: row.event_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: row.metadata,
      createdAt: row.created_at.toISOString(),
    }))
  }

  return { listRecent }
}

module.exports = { createAuditService }
