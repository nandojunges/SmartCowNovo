const express = require('express');
const router = express.Router();
const Bezerras = require('../models/bezerrasModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

router.use(autenticarToken);

router.get('/', (req, res) => {
  const db = initDB(req.user.email);
  const lista = Bezerras.getTodasBezerras(db, req.user.idProdutor);
  res.json(lista);
});

router.post('/', (req, res) => {
  const db = initDB(req.user.email);
  const atualizadas = Bezerras.salvarBezerra(db, req.body, req.user.idProdutor);
  res.json(atualizadas);
});

router.delete('/:id', (req, res) => {
  const db = initDB(req.user.email);
  Bezerras.removerBezerraPorId(db, parseInt(req.params.id), req.user.idProdutor);
  res.json({ success: true });
});

module.exports = router;
