import express from "express";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { v4 as uuid } from "uuid";
import multer from "multer";
import { pool } from "../db.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

// cria tabela se não existir
await pool.query(`
  CREATE TABLE IF NOT EXISTS sires (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// POST /api/v1/sires  (name + pdf)
router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Campo 'name' é obrigatório." });
    if (!req.file) return res.status(400).json({ message: "Arquivo 'pdf' é obrigatório." });

    const id = uuid();
    const baseDir = path.resolve("storage", "sires");
    await ensureDir(baseDir);
    const filename = `${id}.pdf`;
    const filePath = path.join(baseDir, filename);

    await fsp.writeFile(filePath, req.file.buffer);

    await pool.query("INSERT INTO sires (id, name, filename) VALUES ($1, $2, $3)", [id, name, filename]);

    return res.status(201).json({ id, name });
  } catch (err) {
    console.error("[sires POST] error:", err);
    return res.status(500).json({ message: "Falha ao salvar ficha do touro." });
  }
});

// GET /api/v1/sires/:id/pdf
router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT filename FROM sires WHERE id = $1", [id]);
    const row = rows[0];
    if (!row) return res.status(404).send("Touro não encontrado.");

    const filePath = path.resolve("storage", "sires", row.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("PDF não encontrado.");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${row.filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("[sires GET pdf] error:", err);
    res.status(500).send("Erro ao abrir PDF.");
  }
});

export default router;
