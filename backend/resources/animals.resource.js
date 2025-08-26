// backend/resources/animals.resource.js (ESM)
import db from '../dbx.js';
import { z } from '../validate.js';
import { makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';
import express from 'express';

// Pequeno helper para escopo por usuário (igual ao do crudRouter)
function extractUserId(req) {
  const u = req.user || req.auth || {};
  let id = u.id || u.userId || req.userId || u.sub || null;
  if (!id) {
    const auth = req.headers?.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    try {
      if (token) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        id = payload.userId || payload.id || payload.sub || payload.uid || null;
      }
    } catch {}
  }
  return id;
}

const createSchema = z.object({
  numero: z.string().optional(),
  brinco: z.string().optional(),
  nascimento: z.string().optional(), // dd/mm/aaaa (armazenado como TEXT)
  raca: z.string().optional(),
  estado: z.string().optional().default('vazia'),
  sexo: z.string().optional(),                  // 'femea' | 'macho'
  categoria: z.string().optional(),             // calculada no front, mas salvamos
  pai: z.string().optional(),
  pai_id: z.string().optional(),  // referência ao sire
  mae: z.string().optional(),
  n_lactacoes: z.coerce.number().int().nonnegative().optional(),
  ultima_ia: z.string().optional(),             // dd/mm/aaaa
  parto: z.string().optional(),                 // dd/mm/aaaa (último parto)
  previsao_parto: z.string().optional(),        // dd/mm/aaaa
  historico: z.any().optional(),                // JSON com arrays (inseminacoes/partos/secagens)
});
const updateSchema = createSchema.partial();

const cfg = {
  table: 'animals',
  id: 'id',
  listFields: [
    'id','owner_id','numero','brinco','raca','estado','sexo','categoria',
    'n_lactacoes','pai','pai_id','mae','nascimento','ultima_ia','parto','previsao_parto','created_at'
  ],
  searchFields: ['numero','brinco','raca','estado','pai','mae'],
  sortable: [
    'numero','brinco','raca','estado','sexo','categoria',
    'n_lactacoes','nascimento','ultima_ia','parto','previsao_parto','created_at'
  ],
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
  scope: { column: 'owner_id', required: true }, // 🔒 cada usuário vê/salva só o que é dele
};

// 🔎 Interceptor para filtros especiais em /api/v1/animals?view=...
const router = express.Router();
router.get('/', async (req, res, next) => {
  const { view } = req.query || {};
  if (!view) return next();

  const uid = extractUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
  const offset = (page - 1) * limit;
  const days = Math.max(parseInt(req.query.days || '0', 10), 0);

  const prev = `to_date(NULLIF(previsao_parto,''),'DD/MM/YYYY')`;
  let where = ['owner_id = $1'];
  const params = [uid];

  if (view === 'preparto') {
    where.push(`${prev} >= current_date`);
    where.push(`${prev} <= current_date + make_interval(days => $2)`);
    params.push(days || 30);
  } else if (view === 'secagem') {
    where.push(`current_date >= (${prev} - make_interval(days => $2))`);
    where.push(`current_date < ${prev}`);
    params.push(days || 60);
  } else if (view === 'parto') {
    where.push(`${prev} >= current_date`);
    where.push(`${prev} <= current_date + make_interval(days => $2)`);
    params.push(days || 1);
  } else {
    return next();
  }

  const whereSql = 'WHERE ' + where.join(' AND ');
  const fields = cfg.listFields.map(f => `"${f}"`).join(',');

  const sqlItems = `
    SELECT ${fields}
    FROM "${cfg.table}"
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM "${cfg.table}"
    ${whereSql}
  `;

  const [rows, count] = await Promise.all([
    db.query(sqlItems, params),
    db.query(sqlCount, params)
  ]);

  const total = count.rows[0]?.total || 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  return res.json({ items: rows.rows, page, limit, total, pages, sort: 'created_at', order: 'desc', q: '' });
});

// CRUD padrão fica depois (mesma rota)
router.use('/', makeCrudRouter(cfg, db));
export default router;
