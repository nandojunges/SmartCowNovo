import { spawn, spawnSync } from "node:child_process";
import { createGzip } from "node:zlib";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pool } from "./tenancy.js";

const PG = {
  host: process.env.PGHOST || "localhost",
  port: String(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  db:   process.env.PGDATABASE || "postgres",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function hasPgDump() {
  try { return spawnSync("pg_dump", ["--version"], { stdio: "ignore" }).status === 0; }
  catch { return false; }
}

export async function shouldRunDailyBackup(schema) {
  const { rows } = await pool.query(
    "SELECT last_backup_at FROM tenant_backup_state WHERE schema_name=$1",
    [schema]
  );
  const last = rows[0]?.last_backup_at ? new Date(rows[0].last_backup_at) : null;
  return !last || last < startOfToday();
}

export async function markBackupDone(schema) {
  await pool.query(
    `INSERT INTO tenant_backup_state(schema_name,last_backup_at)
     VALUES($1, now())
     ON CONFLICT(schema_name) DO UPDATE SET last_backup_at = EXCLUDED.last_backup_at`,
    [schema]
  );
}

export async function runBackup(schema) {
  if (!hasPgDump()) {
    console.warn(`[backup:${schema}] pg_dump não encontrado – pulando backup`);
    await markBackupDone(schema);
    return null;
  }

  const baseDir = path.join(process.cwd(), "backups", "tenants", schema);
  const dayDir  = path.join(baseDir, new Date().toISOString().slice(0,10));
  await fsp.mkdir(dayDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0,19);
  const outFile = path.join(dayDir, `${schema}-${ts}.sql.gz`);

  return new Promise((resolve, reject) => {
    const args = ["-h", PG.host, "-p", PG.port, "-U", PG.user, "-d", PG.db,
                  "-n", schema, "--clean", "--if-exists", "--no-owner"];
    const dump = spawn("pg_dump", args, { env: { ...process.env } });
    const gzip = createGzip();
    const out  = fs.createWriteStream(outFile);

    dump.stdout.pipe(gzip).pipe(out);

    let stderr = "";
    dump.stderr.on("data", (d) => (stderr += d.toString()));
    dump.on("error", reject);
    out.on("error", reject);

    out.on("close", async () => {
      if (stderr) console.warn(`[backup:${schema}]`, stderr);
      await markBackupDone(schema);
      resolve(outFile);
    });
  });
}

const inFlight = new Map();
export async function maybeBackup(schema) {
  if (!(await shouldRunDailyBackup(schema))) return null;
  if (inFlight.get(schema)) return null;
  inFlight.set(schema, true);
  try { return await runBackup(schema); }
  finally { inFlight.delete(schema); }
}