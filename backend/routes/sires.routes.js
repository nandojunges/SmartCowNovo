import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const router = express.Router();

// Pasta dos PDFs
const SIRES_DIR = path.join(process.cwd(), "uploads", "sires");
fs.mkdirSync(SIRES_DIR, { recursive: true });

// Usaremos memoryStorage para forçar o nome final <id>.pdf
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Apenas PDF é permitido."));
    }
    cb(null, true);
  },
});

// POST /api/v1/sires/:id/pdf   (campo pode ser file, pdf ou arquivo)
router.post("/:id/pdf", upload.any(), async (req, res) => {
  try {
    const id = req.params.id;
    const f =
      req.files?.find((x) => ["file", "pdf", "arquivo"].includes(x.fieldname)) ||
      req.files?.[0];

    if (!f) {
      return res
        .status(400)
        .json({ error: "Arquivo não recebido (use o campo 'file')." });
    }

    const dest = path.join(SIRES_DIR, `${id}.pdf`);
    fs.writeFileSync(dest, f.buffer);
    console.log(`[SIRES] PDF salvo -> ${dest}`);
    return res.status(201).json({ ok: true, path: `/uploads/sires/${id}.pdf` });
  } catch (e) {
    console.error("[SIRES] Erro no upload:", e);
    return res.status(500).json({ error: "Falha ao salvar PDF." });
  }
});

// GET /api/v1/sires/:id/pdf
router.get("/:id/pdf", async (req, res) => {
  const filePath = path.join(SIRES_DIR, `${req.params.id}.pdf`);
  console.log(`[SIRES] solicitando PDF -> ${filePath}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF não encontrado para este touro." });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ficha-${req.params.id}.pdf"`
  );
  return res.sendFile(filePath);
});

export default router;
