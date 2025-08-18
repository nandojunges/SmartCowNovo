import { maybeBackup } from "../db/backup.js";

export function backupOnWrite(req, res, next) {
  const m = (req.method || "").toUpperCase();
  const isWrite = m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";

  if (!isWrite) return next();

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400 && req.tenantSchema) {
      maybeBackup(req.tenantSchema).catch((e) => {
        console.error(`[backup error] schema=${req.tenantSchema}`, e);
      });
    }
  });

  next();
}