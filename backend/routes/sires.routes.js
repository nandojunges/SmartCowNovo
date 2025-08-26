import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const router = express.Router();

// Pasta onde os PDFs serão salvos
const SIRES_DIR = path.join(process.cwd(), "uploads", "sires");
fs.mkdirSync(SIRES_DIR, { recursive: true });

// Aceita só PDF, até 15 MB
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SIRES_DIR),
    filename: (req, file, cb) => {
      const { id } = req.params;
      cb(null, `${id}.pdf`); // sobrescreve a ficha do touro
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Apenas PDF é permitido."));
    }
    cb(null, true);
  },
});

// POST /api/v1/sires/:id/pdf  -> upload da ficha (campo "file")
router.post("/:id/pdf", upload.single("file"), async (req, res) => {
  return res.status(201).json({ ok: true });
});

// GET /api/v1/sires/:id/pdf   -> devolve a ficha
router.get("/:id/pdf", async (req, res) => {
  const filePath = path.join(SIRES_DIR, `${req.params.id}.pdf`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF não encontrado para este touro." });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="ficha-${req.params.id}.pdf"`);
  return res.sendFile(filePath);
});

export default router;
