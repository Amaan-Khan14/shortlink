// Reusable Postgres error markers. Repositories throw these so services can
// map driver errors to stable API errors without importing pg everywhere.
function DUPLICATE_CODE() {
  const err = new Error('duplicate short code')
  err.code = 'DUPLICATE_CODE'
  return err
}

module.exports = { DUPLICATE_CODE }
