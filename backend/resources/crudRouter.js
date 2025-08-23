// backend/resources/crudRouter.js  (ESM)
import express from 'express';
import { v4 as uuid } from 'uuid';

// sanitiza campo de ordenação
function sanitizeSort(sort, allowed) {
  if (!sort) return null;
  const ok = allowed.includes(sort);
  return ok ? sort : null;
}

/**
 * cfg:
 *  - table, id, listFields, searchFields?, sortable?, validateCreate, validateUpdate, defaults
 * hooks:
 *  - beforeCreate?, beforeUpdate?
 */
export function makeCrudRouter(cfg, db, hooks = {}) {
  const router = express.Router();
  const { beforeCreate, beforeUpdate } = hooks;

  const SEARCHABLE = cfg.searchFields || cfg.listFields.filter(f => f !== cfg.id);
  const SORTABLE   = cfg.sortable || cfg.listFields;

  // LIST com q, page, limit, sort, order, from, to
  router.get('/', async (req, res) => {
    const q = (req.query.q || '').trim();

    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const offset = (page - 1) * limit;

    const sortRaw  = (req.query.sort || '').trim();
    const orderRaw = (req.query.order || 'desc').toLowerCase();
    const sort  = sanitizeSort(sortRaw, SORTABLE) || 'created_at';
    const order = orderRaw === 'asc' ? 'ASC' : 'DESC';

    const from = (req.query.from || '').trim();
    const to   = (req.query.to || '').trim();

    const params = [];
    const where = [];

    if (q) {
      const ors = SEARCHABLE.map((f) => {
        params.push(`%${q}%`);
        return `"${f}" ILIKE $${params.length}`;
      }).join(' OR ');
      if (ors) where.push(`(${ors})`);
    }

    if (from) { params.push(from); where.push(`"created_at" >= $${params.length}`); }
    if (to)   { params.push(to);   where.push(`"created_at" <= $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const fields = cfg.listFields.map(f => `"${f}"`).join(', ');

    const countSql = `SELECT COUNT(*)::int AS total FROM "${cfg.table}" ${whereSql}`;
    const { rows: countRows } = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;
    const pages = Math.max(Math.ceil(total / limit), 1);

    const dataSql = `
      SELECT ${fields}
      FROM "${cfg.table}"
      ${whereSql}
      ORDER BY "${sort}" ${order} NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;
    const { rows } = await db.query(dataSql, params);

    res.json({ items: rows, page, limit, total, pages, sort, order, q });
  });

  // GET by id
  router.get('/:id', async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM "${cfg.table}" WHERE "${cfg.id}" = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  });

  // CREATE
  router.post('/', cfg.validateCreate, async (req, res) => {
    const data = { [cfg.id]: uuid(), ...cfg.defaults?.(), ...req.validated };
    if (beforeCreate) await beforeCreate(data, req);

    const cols = Object.keys(data);
    const vals = Object.values(data);
    const params = vals.map((_, i) => `$${i + 1}`).join(', ');

    const text = `INSERT INTO "${cfg.table}" (${cols.map(c => `"${c}"`).join(', ')})
                  VALUES (${params})
                  RETURNING *`;
    const { rows } = await db.query(text, vals);
    res.status(201).json(rows[0]);
  });

  // UPDATE
  router.put('/:id', cfg.validateUpdate, async (req, res) => {
    const id = req.params.id;
    const ex = await db.query(`SELECT 1 FROM "${cfg.table}" WHERE "${cfg.id}" = $1`, [id]);
    if (!ex.rows[0]) return res.status(404).json({ error: 'Not found' });

    const patch = { ...req.validated };
    if (beforeUpdate) await beforeUpdate(patch, req);

    const entries = Object.entries(patch);
    if (!entries.length) {
      const { rows } = await db.query(
        `SELECT * FROM "${cfg.table}" WHERE "${cfg.id}" = $1 LIMIT 1`,
        [id]
      );
      return res.json(rows[0]);
    }

    const sets = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
    const vals = entries.map(([, v]) => v);
    const text = `UPDATE "${cfg.table}" SET ${sets} WHERE "${cfg.id}" = $${entries.length + 1} RETURNING *`;
    const { rows } = await db.query(text, [...vals, id]);
    res.json(rows[0]);
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    await db.query(`DELETE FROM "${cfg.table}" WHERE "${cfg.id}" = $1`, [req.params.id]);
    res.status(204).send();
  });

  return router;
}
