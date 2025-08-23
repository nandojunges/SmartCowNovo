// backend/resources/crudRouter.js
import express from 'express';
import { v4 as uuid } from 'uuid';

/**
 * cfg:
 *  - table: string
 *  - id: string
 *  - listFields: string[]
 *  - validateCreate: middleware
 *  - validateUpdate: middleware
 *  - defaults: () => object
 * obs: usa db.query estilo PG (text, params)
 */
function makeCrudRouter(cfg, db, hooks = {}) {
  const router = express.Router();
  const { beforeCreate, beforeUpdate } = hooks;

  // LIST com busca simples (?q=)
  router.get('/', async (req, res) => {
    const q = (req.query.q || '').trim();
    const fields = cfg.listFields.map(f => `"${f}"`).join(', ');
    let text = `SELECT ${fields} FROM "${cfg.table}"`;
    const params = [];

    if (q) {
      const likeClauses = cfg.listFields
        .filter(f => f !== cfg.id)
        .map((f, i) => {
          params.push(`%${q}%`);
          return `"${f}" ILIKE $${params.length}`;
        })
        .join(' OR ');
      if (likeClauses) text += ` WHERE ${likeClauses}`;
    }

    text += ' ORDER BY "created_at" DESC NULLS LAST';
    const { rows } = await db.query(text, params);
    res.json(rows);
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

    // Confere existência
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

export { makeCrudRouter };
