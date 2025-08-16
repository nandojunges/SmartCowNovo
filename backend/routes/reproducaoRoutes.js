const express = require('express');
const router = express.Router();
const Reproducao = require('../models/reproducaoModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');
// Importa o serviço que integra reprodução com tarefas e estoque
const { handleReproducao } = require('../services/reproducaoService');

router.use(autenticarToken);

router.get('/:numero', (req, res) => {
  const db = initDB(req.user.email);
  const dados = Reproducao.getReproducaoAnimal(db, req.params.numero, req.user.idProdutor);
  res.json(dados);
});

router.post('/', async (req, res) => {
  const db = initDB(req.user.email);
  const dados = Reproducao.registrarIA(db, req.body, req.user.idProdutor);
  // Aciona serviços complementares (tarefas, estoque, etc.)
  await handleReproducao(db, req.body, req.user.idProdutor);
  res.status(201).json(dados);
});

router.post('/diagnostico', async (req, res) => {
  const db = initDB(req.user.email);
  const dados = Reproducao.registrarDiagnostico(db, req.body, req.user.idProdutor);
  // Diagnóstico também aciona o serviço de reprodução
  await handleReproducao(db, req.body, req.user.idProdutor);
  res.status(201).json(dados);
});

module.exports = router;
