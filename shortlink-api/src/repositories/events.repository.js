// Click-event storage and analytics aggregation SQL.
//
// recordClick is the redirect hot path: one indexed UPDATE on links (the
// clicks counter stays the fast aggregate) plus one INSERT into link_events,
// in a single transaction. Aggregations below read only from link_events.
function createEventsRepository(pool) {
  async function getLinkId(code) {
    const { rows } = await pool.query('SELECT id FROM links WHERE code = $1', [code])
    return rows[0]?.id ?? null
  }

  // Returns { status: 'ok', url } | { status: 'not_found' | 'expired' | 'disabled' }
  async function recordClick(code, event) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `UPDATE links SET clicks = clicks + 1
         WHERE code = $1
           AND is_enabled
           AND (expires_at IS NULL OR expires_at > now())
         RETURNING id, url`,
        [code]
      )
      if (rows.length === 0) {
        const state = await client.query(
          'SELECT is_enabled, expires_at FROM links WHERE code = $1',
          [code]
        )
        await client.query('COMMIT')
        if (state.rows.length === 0) return { status: 'not_found' }
        if (!state.rows[0].is_enabled) return { status: 'disabled' }
        return { status: 'expired' }
      }
      const link = rows[0]
      await client.query(
        `INSERT INTO link_events (link_id, referrer, device, browser, operating_system)
         VALUES ($1, $2, $3, $4, $5)`,
        [link.id, event.referrer, event.device, event.browser, event.operatingSystem]
      )
      await client.query('COMMIT')
      return { status: 'ok', url: link.url }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async function getAnalytics(code, days) {
    const linkId = await getLinkId(code)
    if (linkId === null) return null

    const totals = await pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE occurred_at >= date_trunc('day', now()))::int AS today,
              count(*) FILTER (WHERE occurred_at >= now() - interval '7 days')::int AS week
       FROM link_events WHERE link_id = $1`,
      [linkId]
    )
    const timeline = await pool.query(
      `SELECT to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') AS day, count(*)::int AS clicks
       FROM link_events
       WHERE link_id = $1 AND occurred_at >= now() - make_interval(days => $2)
       GROUP BY 1 ORDER BY 1`,
      [linkId, Number(days) + 1]
    )
    const top = async (column) => {
      const { rows } = await pool.query(
        `SELECT ${column} AS name, count(*)::int AS clicks
         FROM link_events WHERE link_id = $1
         GROUP BY 1 ORDER BY clicks DESC, name ASC LIMIT 8`,
        [linkId]
      )
      return rows
    }
    const [referrers, devices, browsers, operatingSystems] = await Promise.all([
      top('referrer'),
      top('device'),
      top('browser'),
      top('operating_system'),
    ])

    return {
      totals: totals.rows[0],
      timeline: timeline.rows,
      referrers,
      devices,
      browsers,
      operatingSystems,
    }
  }

  return { recordClick, getAnalytics }
}

module.exports = { createEventsRepository }
