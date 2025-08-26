import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import db from '../dbx.js';
import { z } from '../validate.js';
import { makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';
import { v4 as uuid } from 'uuid';

function extractUserId(req) {
  const u = req.user || req.auth || {};
  let id = u.id || u.userId || req.userId || u.sub || null;
  if (!id) {
    const auth = req.headers?.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    try {
      if (token) {
        const p = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        id = p.userId || p.id || p.sub || p.uid || null;
      }
    } catch {}
  }
  return id;
}

// CRUD básico
const createSchema = z.object({
  nome: z.string().min(1),
  codigo: z.string().optional(),
  raca: z.string().optional(),
  notas: z.string().optional(),
});
const updateSchema = createSchema.partial();

const cfg = {
  table: 'sires',
  id: 'id',
  listFields: ['id','owner_id','nome','codigo','raca','notas','created_at'],
  searchFields: ['nome','codigo','raca'],
  sortable: ['nome','created_at'],
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
  scope: { column: 'owner_id', required: true },
};

const router = express.Router();
router.use('/', makeCrudRouter(cfg, db));

// Upload de PDF
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const uid = extractUserId(req);
      const { id } = req.params;
      const dir = path.join(process.cwd(), 'storage', 'uploads', uid || 'anon', 'sires', id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
  }),
  fileFilter(_req, file, cb) {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Apenas PDF'));
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post('/:id/file', upload.single('file'), async (req, res) => {
  const uid = extractUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  // conferir se sire pertence ao usuário
  const ex = await db.query(`SELECT 1 FROM sires WHERE id=$1 AND owner_id=$2`, [req.params.id, uid]);
  if (!ex.rows[0]) return res.status(404).json({ error: 'Sire not found' });

  const rec = {
    id: uuid(),
    owner_id: uid,
    sire_id: req.params.id,
    filename: req.file.originalname,
    mime: req.file.mimetype,
    size_bytes: req.file.size,
    path: req.file.path,
  };
  const { rows } = await db.query(
    `INSERT INTO sire_files(id, owner_id, sire_id, filename, mime, size_bytes, path)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [rec.id, rec.owner_id, rec.sire_id, rec.filename, rec.mime, rec.size_bytes, rec.path]
  );
  res.status(201).json(rows[0]);
});

router.get('/:id/files', async (req, res) => {
  const uid = extractUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const { rows } = await db.query(
    `SELECT id, filename, mime, size_bytes, created_at FROM sire_files WHERE sire_id=$1 AND owner_id=$2 ORDER BY created_at DESC`,
    [req.params.id, uid]
  );
  res.json(rows);
});

export default router;
