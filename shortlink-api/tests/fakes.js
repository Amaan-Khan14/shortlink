// In-memory repositories implementing the same interfaces as
// src/repositories/*.js, so the real service logic runs in tests with no
// database. `healthy` flips the ping used by /health and /ready.
function createFakeRepos({ healthy = true } = {}) {
  let nextId = 1
  const links = [] // { id, code, url, clicks, created_at, expires_at, is_enabled, collection_id }
  const collections = [] // { id, name, created_at }
  const events = [] // { id, link_id, occurred_at, referrer, device, browser, operating_system }
  const auditLogs = [] // { id, event_type, resource_type, resource_id, metadata, created_at }

  const DUPLICATE_CODE = () => Object.assign(new Error('duplicate'), { code: 'DUPLICATE_CODE' })
  const row = (link) => ({
    ...link,
    collection_name: link.collection_id
      ? collections.find((c) => c.id === link.collection_id)?.name ?? null
      : null,
  })

  const linksRepo = {
    async createLink({ code, url, expiresAt, collectionId }) {
      if (links.some((l) => l.code === code)) throw DUPLICATE_CODE()
      const link = {
        id: nextId++,
        code,
        url,
        clicks: 0,
        created_at: new Date(),
        expires_at: expiresAt ?? null,
        is_enabled: true,
        collection_id: collectionId ?? null,
      }
      links.push(link)
      return { ...row(link) }
    },
    async getLinkByCode(code) {
      const link = links.find((l) => l.code === code)
      return link ? { ...row(link) } : null
    },
    async listLinks(limit = 50) {
      return [...links]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit)
        .map((l) => ({ ...row(l) }))
    },
    async updateLink(code, fields) {
      const link = links.find((l) => l.code === code)
      if (!link) return null
      if (fields.url !== undefined) link.url = fields.url
      if (fields.expiresAt !== undefined) link.expires_at = fields.expiresAt
      if (fields.isEnabled !== undefined) link.is_enabled = fields.isEnabled
      if (fields.collectionId !== undefined) link.collection_id = fields.collectionId
      return { ...row(link) }
    },
    async deleteLink(code) {
      const idx = links.findIndex((l) => l.code === code)
      if (idx === -1) return false
      const [removed] = links.splice(idx, 1)
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].link_id === removed.id) events.splice(i, 1)
      }
      return true
    },
  }

  const eventsRepo = {
    // Mirrors the transactional redirect path, including classification.
    async recordClick(code, event) {
      const link = links.find((l) => l.code === code)
      if (!link) return { status: 'not_found' }
      if (!link.is_enabled) return { status: 'disabled' }
      if (link.expires_at && link.expires_at.getTime() <= Date.now()) {
        return { status: 'expired' }
      }
      link.clicks += 1
      events.push({
        id: nextId++,
        link_id: link.id,
        occurred_at: new Date(),
        referrer: event.referrer,
        device: event.device,
        browser: event.browser,
        operating_system: event.operatingSystem,
      })
      return { status: 'ok', url: link.url }
    },
    async getAnalytics(code, days) {
      const link = links.find((l) => l.code === code)
      if (!link) return null
      const mine = events.filter((e) => e.link_id === link.id)
      const dayKey = (d) => d.toISOString().slice(0, 10)
      const since = new Date(Date.now() - days * 86400_000)
      const within = mine.filter((e) => e.occurred_at >= since)

      const count = (list, key) =>
        Object.entries(
          list.reduce((acc, e) => ({ ...acc, [e[key]]: (acc[e[key]] ?? 0) + 1 }), {})
        ).map(([name, clicks]) => ({ name, clicks }))

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      return {
        totals: {
          total: mine.length,
          today: mine.filter((e) => e.occurred_at >= startOfToday).length,
          week: mine.filter((e) => e.occurred_at >= new Date(Date.now() - 7 * 86400_000)).length,
        },
        timeline: Object.entries(
          within.reduce((acc, e) => {
            const k = dayKey(e.occurred_at)
            return { ...acc, [k]: (acc[k] ?? 0) + 1 }
          }, {})
        ).map(([day, clicks]) => ({ day, clicks })),
        referrers: count(mine, 'referrer'),
        devices: count(mine, 'device'),
        browsers: count(mine, 'browser'),
        operatingSystems: count(mine, 'operating_system'),
      }
    },
  }

  const collectionsRepo = {
    async listCollections() {
      return collections.map((c) => ({
        ...c,
        link_count: links.filter((l) => l.collection_id === c.id).length,
      }))
    },
    async createCollection(name) {
      if (collections.some((c) => c.name === name)) {
        throw Object.assign(new Error('dup'), { code: '23505' })
      }
      const collection = { id: nextId++, name, created_at: new Date() }
      collections.push(collection)
      return { ...collection }
    },
    async findByName(name) {
      return collections.find((c) => c.name === name) ?? null
    },
    async deleteCollection(id) {
      const idx = collections.findIndex((c) => c.id === id)
      if (idx === -1) return false
      collections.splice(idx, 1)
      links.forEach((l) => {
        if (l.collection_id === id) l.collection_id = null
      })
      return true
    },
    async findOrCreateByName(name) {
      return (await this.findByName(name)) ?? this.createCollection(name)
    },
  }

  const auditRepo = {
    async record(entry) {
      auditLogs.push({
        id: nextId++,
        event_type: entry.type,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId ?? null,
        metadata: entry.metadata ?? {},
        created_at: new Date(),
      })
    },
    async listRecent(limit = 50) {
      return [...auditLogs].reverse().slice(0, limit)
    },
  }

  const ping = async () => {
    if (!healthy) throw new Error('unhealthy')
  }

  return { linksRepo, eventsRepo, collectionsRepo, auditRepo, ping }
}

module.exports = { createFakeRepos }
