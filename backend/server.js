// backend/server.js (ESM)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bootstrapResources from "./bootstrapResources.js";

import authRoutes from "./routes/auth.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { backupOnWrite } from "./middleware/backupOnWrite.js";
import animalsResource from "./resources/animals.resource.js";
import productsResource from "./resources/products.resource.js";
import animalsMetrics from "./resources/animals.metrics.js";
import productsMetrics from "./resources/products.metrics.js";

// __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega env do backend/.env e (fallback) da raiz
const envBackend = path.join(__dirname, ".env");
const envRoot = path.join(__dirname, "..", ".env");
dotenv.config({ path: envBackend });
dotenv.config({ path: envRoot });

// LOG de conferência do .env (ajuda a diagnosticar SMTP 500)
const mask = (v) => (v ? "set" : "missing");
if (process.env.LOG_ENV_PATH === "true") {
  console.log("ENV paths tried:", { backendEnv: envBackend, rootEnv: envRoot });
}
console.log("SMTP CONFIG =>", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  EMAIL_REMETENTE: mask(process.env.EMAIL_REMETENTE),
  EMAIL_SENHA_APP: mask(process.env.EMAIL_SENHA_APP),
});

// Flags
const BACKUP_ENABLED = process.env.BACKUP_ENABLED === "true";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Ativa multi-tenant/backup só quando quiser
if (BACKUP_ENABLED) {
  app.use(tenantContext);
  app.use(backupOnWrite);
}

// Garante tabelas e registra recursos adicionais
try {
  await bootstrapResources(app);
} catch (err) {
  console.error('Falha ao iniciar recursos:', err);
}

// Logger focado em /api/auth/*
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (!/^\/api\/auth(\/|$)/.test(req.originalUrl)) return;
    console.log(JSON.stringify({
      tag: "AUTH",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
    }));
  });
  next();
});

// Health check (confirma proxy e porta)
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    backupEnabled: BACKUP_ENABLED,
    smtp: {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      secure: process.env.SMTP_SECURE || null,
      EMAIL_REMETENTE: mask(process.env.EMAIL_REMETENTE),
      EMAIL_SENHA_APP: mask(process.env.EMAIL_SENHA_APP),
    },
  });
});

// Servir arquivos estáticos usados pelo front (ex.: rotativos .txt, imagens do login)
app.use("/api/data", express.static(path.join(__dirname, "data")));

// Garante pasta para dumps/recuperações manuais (compatível com seu antigo)
fs.mkdirSync(path.join(__dirname, "dadosExcluidos"), { recursive: true });

// servir arquivos enviados (ex.: PDFs de touros)
app.use('/files', express.static(path.join(process.cwd(), 'storage', 'uploads')));

// Rotas da API
// ⚠️ Mantenha por enquanto só as essenciais.
// Quando for reativar módulos, monte-os aqui, já protegidos com auth/db conforme você recriar.
app.use("/api/auth", authRoutes);

// === Novos recursos v1 ===
// === Métricas v1 (registre ANTES de animals CRUD) ===
app.use('/api/v1/animals/metrics', animalsMetrics);
app.use('/api/v1/products/metrics', productsMetrics);

// === Recursos v1 ===
app.use('/api/v1/animals', animalsResource);
app.use('/api/v1/products', productsResource);

// Healthcheck opcional
app.get('/api/v1/health', (_req, res) => res.json({ ok: true }));

// Bloqueio explícito para evitar o SPA “engolir” 404 de /api/*
app.use("/api/*", (req, res) => {
  return res.status(404).json({ error: "API route não encontrada" });
});

// SPA estático (build do React). Em dev, o Vite cuida.
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route não encontrada" });
  }
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  // Dev fallback (sem build)
  return res
    .status(200)
    .send("<!doctype html><html><body><h1>Dev server ativo</h1></body></html>");
});

// Handler de erro (por último)
app.use((err, req, res, next) => {
  console.error("❌ ERRO:", {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    stack: err?.stack || String(err),
  });
  res.status(500).json({ error: "Internal Server Error" });
});

// Jobs opcionais (somente se habilitar a flag)
if (process.env.ENABLE_PREPARTO_JOB === "true") {
  import("./jobs/preparto.js")
    .then((m) => (typeof m.default === "function" ? m.default() : null))
    .catch((e) => console.error("Erro ao iniciar job preparto:", e));
}

const server = app.listen(PORT, () => {
  console.log(`API v1 on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Porta ${PORT} já está em uso.`);
    process.exit(1);
  } else {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
});

export default app;
