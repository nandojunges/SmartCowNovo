const { Pool } = require('pg');
const cfg = require('../config/env');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: cfg.db.host,
      port: cfg.db.port,
      user: cfg.db.user,
      password: cfg.db.password,
      database: cfg.db.database,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

async function query(text, params) {
  const res = await getPool().query(text, params);
  return res.rows;
}
async function run(text, params) {
  await getPool().query(text, params);
}
async function tx(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback({
      query: (t, p) => client.query(t, p),
    });
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function ping() {
  await getPool().query('SELECT 1');
  return true;
}

module.exports = { query, run, tx, ping, getPool };
