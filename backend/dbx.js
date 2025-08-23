// backend/dbx.js
// Adapta o seu módulo de DB já existente para expor { query(text, params) }.
// NÃO ALTERA seu DB atual; só cria uma "fachada" segura.

import mod from './db.js';

const db =
  (mod.query && mod) ||
  (mod.pool && mod.pool.query && mod.pool) ||
  (mod.default && mod.default.query && mod.default) ||
  (mod.default && mod.default.pool && mod.default.pool.query && mod.default.pool);

if (!db || typeof db.query !== 'function') {
  throw new Error('dbx: Módulo de DB não expõe .query(text, params). Verifique sua exportação.');
}

export default db;
