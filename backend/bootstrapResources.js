// backend/bootstrapResources.js
// Garante TABELAS dos recursos sem tocar no seu schema de AUTH/USERS.
import db from './dbx.js';

async function ensureTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      numero TEXT,
      brinco TEXT,
      nascimento TEXT,
      raca TEXT,
      estado TEXT DEFAULT 'vazia',
      ultima_ia TEXT,
      parto TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT,
      unidade TEXT,           -- kg, L, mL, un
      preco_unit DOUBLE PRECISION,
      quantidade DOUBLE PRECISION,
      validade TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await db.query(sql);
}

export { ensureTables };
