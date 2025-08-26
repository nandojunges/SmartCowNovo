import path from "node:path";
import fsp from "node:fs/promises";

const FILE_ROOT = process.env.FILE_STORAGE_ROOT || "./storage";

function safeName(str) {
  return String(str)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 180);
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export async function backupOnWrite(req, _res, next) {
  try {
    const root = path.resolve(FILE_ROOT, "_backups");
    const userId = String(req.user?.id || "anon");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    const dayDir = path.join(root, userId, `${yyyy}-${mm}-${dd}`);
    await ensureDir(dayDir);

    const filename = `${hh}${mi}${ss}-${req.method}-${safeName(req.originalUrl)}.json`;
    const filePath = path.join(dayDir, filename);

    const payload = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body && Object.keys(req.body).length ? req.body : undefined,
      at: now.toISOString(),
    };

    await fsp.writeFile(filePath, JSON.stringify(payload, null, 2));
  } catch (err) {
    console.warn("[backupOnWrite] warn:", err.message);
  }
  next();
}
