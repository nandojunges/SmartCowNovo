const fs = require('fs');
const path = require('path');
const { getPool } = require('../services/dbAdapter');

(async () => {
  const pool = getPool();
  const sql = fs.readFileSync(path.resolve(__dirname, '../sql/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Schema aplicado');
  process.exit(0);
})().catch(err => {
  console.error('❌ Falha ao aplicar schema:', err.message);
  process.exit(1);
});
