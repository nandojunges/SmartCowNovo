// backend/resources/animals.metrics.js
import express from 'express';
import db from '../dbx.js';

const router = express.Router();

// GET /api/v1/animals/metrics?days=30
router.get('/', async (req, res) => {
  const days = Math.max(parseInt(req.query.days || '30', 10), 1);

  // total de animais
  const total = (await db.query(`SELECT COUNT(*)::int AS c FROM animals`)).rows[0].c;

  // lactação ativa (depende do uso do campo 'estado' = 'lactacao')
  const lactacao_ativas = (await db.query(
    `SELECT COUNT(*)::int AS c FROM animals WHERE estado = 'lactacao'`
  )).rows[0].c;

  // Média de DEL (dias desde o parto)
  const media_del = (await db.query(
    `SELECT ROUND(AVG( (now()::date - NULLIF(parto,'')::date) ))::int AS del
     FROM animals
     WHERE NULLIF(parto,'') IS NOT NULL`
  )).rows[0].del || 0;

  // cadastrados nos últimos N dias
  const cadastrados_nd = (await db.query(
    `SELECT COUNT(*)::int AS c FROM animals WHERE created_at >= now() - ($1 || ' days')::interval`,
    [days]
  )).rows[0].c;

  // distribuição por raça (top 10)
  const por_raca = (await db.query(
    `SELECT COALESCE(raca,'(sem raça)') AS raca, COUNT(*)::int AS qtd
     FROM animals
     GROUP BY 1
     ORDER BY qtd DESC
     LIMIT 10`
  )).rows;

  res.json({
    cards: {
      total_animais: total,
      lactacao_ativas,
      media_del,
      cadastrados_ultimos_dias: { dias: days, total: cadastrados_nd },
    },
    tables: { por_raca },
  });
});

export default router;

