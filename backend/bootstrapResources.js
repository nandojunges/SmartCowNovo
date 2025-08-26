// backend/bootstrapResources.js  (ESM)
import db from './dbx.js';

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
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS mae TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS n_lactacoes INTEGER;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS previsao_parto TEXT;
    ALTER TABLE animals  ADD COLUMN IF NOT EXISTS historico JSONB;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_animals_owner  ON animals(owner_id);
    CREATE INDEX IF NOT EXISTS idx_animals_num    ON animals(numero);
    CREATE INDEX IF NOT EXISTS idx_animals_brinco ON animals(brinco);
    CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);
  `;
  await db.query(sql);
}
