// backend/scripts/reset-db.js
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env do backend e (fallback) da raiz
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { Pool } = pg;
const pool = new Pool(); // usa PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

async function resetDb() {
  console.log('🗄️  Conectando ao Postgres…');
  const client = await pool.connect();
  try {
    console.log('💣  DROP SCHEMA public CASCADE');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');

    console.log('🏗️  CREATE SCHEMA public');
    await client.query('CREATE SCHEMA public;');

    console.log('🔐  Dono do schema → usuário atual');
    await client.query('ALTER SCHEMA public OWNER TO CURRENT_USER;');

    console.log('✅ Banco limpo.');
  } finally {
    client.release();
  }
}

function resetStorage() {
  const rootEnv = process.env.FILE_STORAGE_ROOT || './storage';
  const abs = path.resolve(path.join(__dirname, '..', rootEnv));
  const usersPath = path.join(abs, 'users');

  console.log('🧹 Limpando storage de usuários:', usersPath);
  try { fs.rmSync(usersPath, { recursive: true, force: true }); } catch (_) {}
  try { fs.mkdirSync(usersPath, { recursive: true }); } catch (e) {
    console.warn('⚠️  Não consegui recriar a pasta de usuários:', e.message);
  }
  console.log('✅ Storage limpo.');
}

(async () => {
  try {
    await resetDb();
    resetStorage();
    console.log('🎉 Pronto! Tudo zerado.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro ao resetar:', e.message || e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
