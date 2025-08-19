// backend/routes/auth.js (ESM) — fluxo completo e robusto
import { Router } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool(); // PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD via .env

const router = Router();

/* ============ CONFIG BÁSICA ============ */
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-altere";
const TTL_MIN = Number(process.env.VERIFICATION_TTL_MINUTES || 3);
const FILE_ROOT = process.env.FILE_STORAGE_ROOT || "./storage";

/* ============ UTILS ============ */
const normEmail = (e) => String(e || "").trim().toLowerCase();

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function ensureUserDirs(userId) {
  const base = path.resolve(FILE_ROOT, "users", String(userId));
  ensureDir(base);
  ensureDir(path.join(base, "uploads"));
  ensureDir(path.join(base, "reports"));
  ensureDir(path.join(base, "tmp"));
  return base;
}
function genCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}
async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      verification_code TEXT,
      verification_expires TIMESTAMP,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now()
    );
  `);
}

/* ============ SMTP (runtime-safe) ============ */
function smtpSettings() {
  return {
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: String(process.env.SMTP_SECURE ?? "true") === "true",
    user: process.env.EMAIL_REMETENTE,
    pass: process.env.EMAIL_SENHA_APP,
    from: process.env.MAIL_FROM || process.env.EMAIL_REMETENTE,
  };
}
let transporterCache = null;
function getTransport() {
  const s = smtpSettings();
  if (!s.user || !s.pass) {
    throw new Error("SMTP não configurado: defina EMAIL_REMETENTE e EMAIL_SENHA_APP no .env do backend.");
  }
  if (transporterCache) return transporterCache;
  transporterCache = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.user, pass: s.pass },
    // logger: true, debug: true,
  });
  return transporterCache;
}
async function sendMailSafe({ to, subject, html, text }) {
  const s = smtpSettings();
  const t = getTransport();
  await t.verify();
  return t.sendMail({ from: s.from, to, subject, html, text });
}

/* ============ E-MAIL: emissão de códigos ============ */
async function issueVerificationCode(userId, email, subjectPrefix = "Código de verificação") {
  const code = genCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + TTL_MIN * 60_000);

  await pool.query(
    "UPDATE users SET verification_code=$1, verification_expires=$2 WHERE id=$3",
    [codeHash, expires, userId]
  );

  await sendMailSafe({
    to: email,
    subject: `${subjectPrefix} - Gestão Leiteira`,
    html: `<p>Seu código:</p><h2 style="letter-spacing:3px">${code}</h2><p>Expira em ${TTL_MIN} minuto(s).</p>`,
    text: `Código: ${code} (expira em ${TTL_MIN} min)`,
  });

  return { ttl_minutes: TTL_MIN };
}

/* ============ ROTAS ============ */

// Teste SMTP: POST /api/auth/test-mail { to?: string }
router.post("/test-mail", async (req, res, next) => {
  try {
    const to = normEmail(req.body?.to) || process.env.EMAIL_REMETENTE;
    await sendMailSafe({
      to,
      subject: "SMTP OK - Gestão Leiteira",
      text: "Funciona 🚀",
      html: "<p>Funciona 🚀</p>",
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Cadastro: POST /api/auth/register { email, senha }
router.post("/register", async (req, res, next) => {
  try {
    await ensureUsersTable();

    const email = normEmail(req.body?.email);
    const senha = String(req.body?.senha || "");
    if (!email || !senha) return res.status(400).json({ error: "Informe email e senha" });
    if (senha.length < 6) return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });

    // Procura sem depender de case:
    const found = await pool.query("SELECT id, email, verified FROM users WHERE lower(email)=lower($1)", [email]);

    if (found.rowCount) {
      const u = found.rows[0];
      if (u.verified) {
        // já verificado → mantém 409
        return res.status(409).json({ error: "E-mail já cadastrado" });
      }
      // EXISTE e NÃO verificado → ATUALIZA a senha, garante pastas e reemite código
      const password_hash = await bcrypt.hash(senha, 10);
      await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [password_hash, u.id]);

      ensureUserDirs(u.id); // ✅ garante estrutura de pastas mesmo para contas antigas

      const { ttl_minutes } = await issueVerificationCode(u.id, email, "Novo código de verificação");
      return res.status(200).json({
        message: "Conta já criada e ainda não verificada. Atualizamos a senha e enviamos um novo código ao seu e-mail.",
        user: { id: u.id, email, verified: false },
        ttl_minutes,
      });
    }

    // Novo usuário
    const password_hash = await bcrypt.hash(senha, 10);
    const ins = await pool.query(
      "INSERT INTO users (email, password_hash, verified) VALUES ($1,$2,false) RETURNING id, email, verified, created_at",
      [email, password_hash]
    );
    const user = ins.rows[0];

    ensureUserDirs(user.id); // ✅ cria as pastas no cadastro
    const { ttl_minutes } = await issueVerificationCode(user.id, email, "Código de verificação");

    res.status(201).json({
      message: "Cadastro criado. Enviamos um código ao seu e-mail.",
      user: { id: user.id, email: user.email, verified: user.verified, created_at: user.created_at },
      ttl_minutes,
    });
  } catch (err) {
    if (err?.code === "23505") return res.status(409).json({ error: "E-mail já cadastrado" });
    next(err);
  }
});

// Reenviar código: POST /api/auth/resend { email }
router.post("/resend", async (req, res, next) => {
  try {
    await ensureUsersTable();
    const email = normEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "Informe email" });

    const q = await pool.query("SELECT id, verified FROM users WHERE lower(email)=lower($1)", [email]);
    const user = q.rows[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (user.verified) return res.json({ message: "E-mail já verificado." });

    // opcional: garantir pastas aqui também
    ensureUserDirs(user.id);

    const { ttl_minutes } = await issueVerificationCode(user.id, email, "Novo código de verificação");
    res.json({ message: "Novo código enviado.", ttl_minutes });
  } catch (err) { next(err); }
});

// Verificar: POST /api/auth/verify { email, code }
router.post("/verify", async (req, res, next) => {
  try {
    await ensureUsersTable();

    const email = normEmail(req.body?.email);
    const code = String(req.body?.code || "");
    if (!email || !code) return res.status(400).json({ error: "Informe email e code" });

    const q = await pool.query(
      "SELECT id, email, verification_code, verification_expires FROM users WHERE lower(email)=lower($1)",
      [email]
    );
    const user = q.rows[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ error: "Solicite um novo código" });
    }
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ error: "Código expirado" });
    }
    const ok = await bcrypt.compare(code, user.verification_code);
    if (!ok) return res.status(400).json({ error: "Código inválido" });

    await pool.query(
      "UPDATE users SET verified=true, verification_code=NULL, verification_expires=NULL WHERE id=$1",
      [user.id]
    );

    ensureUserDirs(user.id); // ✅ garante pastas ao verificar (cobre contas antigas)

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "E-mail verificado.", token, user: { id: user.id, email: user.email, verified: true } });
  } catch (err) { next(err); }
});

// Login: POST /api/auth/login { email, senha }
router.post("/login", async (req, res, next) => {
  try {
    await ensureUsersTable();

    const email = normEmail(req.body?.email);
    const senha = String(req.body?.senha || "");
    if (!email || !senha) return res.status(400).json({ error: "Informe email e senha" });

    const q = await pool.query(
      "SELECT id, email, password_hash, verified FROM users WHERE lower(email)=lower($1)",
      [email]
    );
    const user = q.rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(senha, user.password_hash))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    if (!user.verified) {
      return res.status(403).json({ error: "E-mail não verificado" });
    }

    ensureUserDirs(user.id); // ✅ garante pastas no primeiro login

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, verified: user.verified } });
  } catch (err) { next(err); }
});

// Esqueci a senha: POST /api/auth/forgot-password { email }
router.post("/forgot-password", async (req, res, next) => {
  try {
    await ensureUsersTable();
    const email = normEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "Informe email" });

    const q = await pool.query("SELECT id, verified FROM users WHERE lower(email)=lower($1)", [email]);
    const user = q.rows[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // opcional: garantir pastas aqui também
    ensureUserDirs(user.id);

    const { ttl_minutes } = await issueVerificationCode(user.id, email, "Código de recuperação de senha");
    res.json({ message: "Enviamos um código para recuperação de senha.", ttl_minutes });
  } catch (err) { next(err); }
});

// Reset senha: POST /api/auth/reset-password { email, code, novaSenha }
router.post("/reset-password", async (req, res, next) => {
  try {
    await ensureUsersTable();
    const email = normEmail(req.body?.email);
    const code = String(req.body?.code || "");
    const novaSenha = String(req.body?.novaSenha || "");

    if (!email || !code || !novaSenha) return res.status(400).json({ error: "Dados incompletos" });
    if (novaSenha.length < 6) return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });

    const q = await pool.query(
      "SELECT id, verification_code, verification_expires, verified FROM users WHERE lower(email)=lower($1)",
      [email]
    );
    const user = q.rows[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ error: "Solicite o código novamente" });
    }
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ error: "Código expirado" });
    }
    const ok = await bcrypt.compare(code, user.verification_code);
    if (!ok) return res.status(400).json({ error: "Código inválido" });

    const password_hash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      "UPDATE users SET password_hash=$1, verification_code=NULL, verification_expires=NULL WHERE id=$2",
      [password_hash, user.id]
    );

    // opcional: garantir pastas também aqui
    ensureUserDirs(user.id);

    res.json({ message: "Senha redefinida com sucesso." });
  } catch (err) { next(err); }
});

// Me: GET /api/auth/me
router.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Sem token" });
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ user: decoded });
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
});

export default router;
