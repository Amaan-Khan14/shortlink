// In-memory repo implementing the same interface as src/repo.js, so the API
// tests run without a database. `healthy` can be flipped to make ping() fail.
function createFakeRepo() {
  const links = new Map(); // code -> row
  let nextId = 1;

  const repo = {
    healthy: true,

    async createLink({ code, url }) {
      if (links.has(code)) {
        const err = new Error(`short code already exists: ${code}`);
        err.code = 'DUPLICATE_CODE';
        throw err;
      }
      const row = { id: nextId++, code, url, clicks: 0, created_at: new Date() };
      links.set(code, row);
      return { ...row };
    },

    async incrementClicks(code) {
      const row = links.get(code);
      if (!row) return null;
      row.clicks += 1;
      return { ...row };
    },

    async listLinks(limit = 50) {
      return [...links.values()]
        .sort((a, b) => b.created_at - a.created_at || b.id - a.id)
        .slice(0, limit)
        .map((row) => ({ ...row }));
    },

    async ping() {
      if (!repo.healthy) throw new Error('unhealthy');
    },
  };

  return repo;
}

module.exports = { createFakeRepo };
