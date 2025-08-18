// backend/routes/auth.js (ESM)
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-altere";

// LOGIN — stub: aceita qualquer email/senha
router.post("/login", (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: "Informe email e senha" });

  const payload = { email, perfil: email.includes("admin") ? "admin" : "funcionario" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// CADASTRO — stub
router.post("/register", (req, res) => {
  // TODO: persistir depois
  return res.status(201).json({ ok: true });
});

// ESQUECI SENHA — stub
router.post("/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Informe email" });
  return res.status(204).end();
});

// RESET SENHA — stub
router.post("/reset-password", (req, res) => {
  const { token, novaSenha } = req.body || {};
  if (!token || !novaSenha) return res.status(400).json({ error: "Dados incompletos" });
  return res.json({ ok: true });
});

// INFO DO USUÁRIO
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
