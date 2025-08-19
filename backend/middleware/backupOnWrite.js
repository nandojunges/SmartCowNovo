// backend/middleware/backupOnWrite.js
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

const FILE_ROOT = process.env.FILE_STORAGE_ROOT || "./storage";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-altere";

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function ymd(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${dd}`;}
function hms(d=new Date()){const h=String(d.getHours()).padStart(2,"0"),m=String(d.getMinutes()).padStart(2,"0"),s=String(d.getSeconds()).padStart(2,"0");return `${h}${m}${s}`;}
function getUserId(req){try{const a=req.headers.authorization||"";if(!a.startsWith("Bearer "))return "anon";const t=a.slice(7);const dec=jwt.verify(t,JWT_SECRET);return dec?.sub||"anon";}catch{return "anon";}}

export function backupOnWrite(req, res, next) {
  const isWrite = ["POST","PUT","PATCH","DELETE"].includes(req.method);
  if (!isWrite || !req.originalUrl.startsWith("/api/")) return next();

  const started = new Date();
  const userId = String(getUserId(req));
  const reqBody = req.body;

  const oldJson = res.json.bind(res);
  res.json = (payload) => {
    try {
      const base = path.resolve(FILE_ROOT, "_backups", userId, ymd(started));
      ensureDir(base);
      const slug = req.originalUrl.replace(/[^\w/-]+/g,"_").slice(0,80).replace(/^_+|_+$/g,"");
      const file = path.join(base, `${hms(started)}-${req.method}-${slug||"req"}.json`);
      const record = { meta:{ ts: started.toISOString(), method: req.method, url: req.originalUrl, userId },
                       request: reqBody, response: payload };
      fs.writeFileSync(file, JSON.stringify(record, null, 2));
    } catch (e) {
      console.error("backupOnWrite error:", e?.message || e);
    }
    return oldJson(payload);
  };

  next();
}
