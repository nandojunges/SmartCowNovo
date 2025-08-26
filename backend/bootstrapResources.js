// backend/bootstrapResources.js  (ESM)
import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import db from './dbx.js';
import { z, makeValidator } from './validate.js';
import { makeCrudRouter, extractUserId } from './resources/crudRouter.js';

export async function ensureTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      numero TEXT,
      brinco TEXT,
      nascimento TEXT,
      raca TEXT,
      estado TEXT DEFAULT 'vazia',
      sexo TEXT,
      categoria TEXT,
      pai TEXT,
      pai_id TEXT,
      mae TEXT,
      n_lactacoes INTEGER,
      ultima_ia TEXT,
      parto TEXT,
      previsao_parto TEXT,
      historico JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      nome TEXT NOT NULL,
      categoria TEXT,
      unidade TEXT,
      preco_unit DOUBLE PRECISION,
      quantidade DOUBLE PRECISION,
      validade TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Garantir colunas caso a tabela já exista (ambiente que veio antes)
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS owner_id TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS sexo TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS categoria TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS pai TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS pai_id TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS mae TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS n_lactacoes INTEGER;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS previsao_parto TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS historico JSONB;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_animals_owner  ON animals(owner_id);
    CREATE INDEX IF NOT EXISTS idx_animals_num    ON animals(numero);
    CREATE INDEX IF NOT EXISTS idx_animals_brinco ON animals(brinco);
    CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);

    -- Sires (touros) + arquivos
    CREATE TABLE IF NOT EXISTS sires (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      nome TEXT NOT NULL,
      codigo TEXT,
      raca TEXT,
      notas TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sires_owner ON sires(owner_id);
    CREATE INDEX IF NOT EXISTS idx_sires_nome  ON sires(nome);

    CREATE TABLE IF NOT EXISTS sire_files (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      sire_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sire_files_owner ON sire_files(owner_id);
    CREATE INDEX IF NOT EXISTS idx_sire_files_sire  ON sire_files(sire_id);
  `;
  await db.query(sql);
}

export default async function bootstrapResources(app) {
  await ensureTables();

  const createSchema = z.object({
    nome: z.string().min(1),
    codigo: z.string().optional(),
    raca: z.string().optional(),
    notas: z.string().optional(),
  });

  app.use(
    '/api/v1/sires',
    makeCrudRouter(
      {
        table: 'sires',
        id: 'id',
        listFields: ['id','owner_id','nome','codigo','raca','notas','created_at'],
        searchFields: ['nome','codigo','raca'],
        sortable: ['nome','created_at'],
        validateCreate: makeValidator(createSchema),
        validateUpdate: makeValidator(createSchema.partial()),
        defaults: () => ({ created_at: new Date().toISOString() }),
        scope: { column: 'owner_id', required: true },
      },
      db
    )
  );

  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        const uid = extractUserId(req) || 'anon';
        const { id } = req.params;
        const dir = path.join(process.cwd(), 'storage', 'uploads', String(uid), 'sires', String(id));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename(_req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
      },
    }),
    fileFilter(_req, file, cb) {
      if (file.mimetype !== 'application/pdf') return cb(new Error('Apenas PDF'));
      cb(null, true);
    },
    limits: { fileSize: 15 * 1024 * 1024 },
  });

  app.post('/api/v1/sires/:id/file', upload.single('file'), async (req, res) => {
    const uid = extractUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const ok = await db.query(`SELECT 1 FROM sires WHERE id=$1 AND owner_id=$2`, [req.params.id, uid]);
    if (!ok.rows[0]) return res.status(404).json({ error: 'Sire not found' });
    const f = req.file;
    if (!f) return res.status(400).json({ error: 'Arquivo ausente' });
    const rec = {
      id: uuid(),
      owner_id: uid,
      sire_id: req.params.id,
      filename: f.originalname,
      mime: f.mimetype,
      size_bytes: f.size,
      path: f.path,
    };
    const { rows } = await db.query(
      `INSERT INTO sire_files(id, owner_id, sire_id, filename, mime, size_bytes, path)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, owner_id, sire_id, filename, mime, size_bytes, created_at`,
      [rec.id, rec.owner_id, rec.sire_id, rec.filename, rec.mime, rec.size_bytes, rec.path]
    );
    res.status(201).json(rows[0]);
  });

  app.get('/api/v1/sires/:id/files', async (req, res) => {
    const uid = extractUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { rows } = await db.query(
      `SELECT id, filename, mime, size_bytes, created_at
         FROM sire_files
        WHERE owner_id=$1 AND sire_id=$2
        ORDER BY created_at DESC`,
      [uid, req.params.id]
    );
    res.json({ items: rows });
  });
}

