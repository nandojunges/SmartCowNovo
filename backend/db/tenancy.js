import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool(); // usa PGHOST/PGUSER/PGPASSWORD/PGDATABASE

export function schemaFromEmail(email) {
  const base = String(email).toLowerCase().replace(/[^a-z0-9]/g, "_");
  const pref = /^[a-z]/.test(base) ? base : `u_${base}`;
  return pref.slice(0, 63);
}

export async function ensureTenant(email) {
  const schema = schemaFromEmail(email);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sql = await fs.readFile(path.join(__dirname, "tenancy.sql"), "utf8");
    await client.query(sql);
    await client.query("SELECT create_tenant($1)", [email]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return { schema };
}