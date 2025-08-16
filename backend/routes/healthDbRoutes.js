const r = require('express').Router();
const db = require('../services/dbAdapter');
r.get('/api/v1/health/db', async (req, res, next) => {
  try { await db.ping(); res.json({ ok:true, db:'up' }); }
  catch (e) { next(e); }
});
module.exports = r;
