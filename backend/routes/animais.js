const express = require('express');
const router = express.Router();

// HOTFIX TEMPORÁRIO – retornar lista vazia para evitar 500 no dashboard
router.get('/', async (req, res) => {
  return res.json([]); // evita 500 e deixa a UI abrir
});

module.exports = router;