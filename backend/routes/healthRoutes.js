const r = require('express').Router();
r.get('/api/v1/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
module.exports = r;
