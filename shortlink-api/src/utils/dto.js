// Maps link rows (snake_case, joined collection) to the public API shape.
function toLinkDto(row, baseUrl) {
  return {
    code: row.code,
    url: row.url,
    shortUrl: `${baseUrl}/${row.code}`,
    clicks: Number(row.clicks), // pg returns BIGINT as a string
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
    isEnabled: row.is_enabled,
    collection: row.collection_id
      ? { id: Number(row.collection_id), name: row.collection_name }
      : null,
  }
}

module.exports = { toLinkDto }
