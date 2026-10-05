// ALL SQL lives in this file. The rest of the app only depends on the object
// createRepo() returns, so tests can swap in an in-memory fake (tests/fakeRepo.js)
// and run without any database at all.

function createRepo(pool) {
  return {
    async createLink({ code, url }) {
      try {
        const { rows } = await pool.query(
          'INSERT INTO links (code, url) VALUES ($1, $2) RETURNING *',
          [code, url]
        );
        return rows[0];
      } catch (err) {
        if (err.code === '23505') {
          // unique_violation on links.code
          const duplicate = new Error(`short code already exists: ${code}`);
          duplicate.code = 'DUPLICATE_CODE';
          throw duplicate;
        }
        throw err;
      }
    },

    async incrementClicks(code) {
      const { rows } = await pool.query(
        'UPDATE links SET clicks = clicks + 1 WHERE code = $1 RETURNING *',
        [code]
      );
      return rows[0] || null;
    },

    async listLinks(limit = 50) {
      const { rows } = await pool.query(
        'SELECT * FROM links ORDER BY created_at DESC, id DESC LIMIT $1',
        [limit]
      );
      return rows;
    },

    async ping() {
      await pool.query('SELECT 1');
    },
  };
}

module.exports = { createRepo };
