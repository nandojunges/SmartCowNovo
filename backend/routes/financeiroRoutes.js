const express = require('express');
const router = express.Router();
const Financeiro = require('../models/financeiroModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

router.use(autenticarToken);

router.get('/', (req, res) => {
  const { inicio, fim } = req.query;
  const db = initDB(req.user.email);
  let dados = Financeiro.getAll(db, req.user.idProdutor);
  if (inicio) dados = dados.filter(d => d.data >= inicio);
  if (fim) dados = dados.filter(d => d.data <= fim);
  res.json(dados);
});

router.post('/', (req, res) => {
  const db = initDB(req.user.email);
  const lanc = Financeiro.create(db, req.body, req.user.idProdutor);
  res.status(201).json(lanc);
});

router.delete('/:id', (req, res) => {
  const db = initDB(req.user.email);
  Financeiro.remove(db, parseInt(req.params.id), req.user.idProdutor);
  res.status(204).end();
});

router.put('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const lanc = Financeiro.update(db, parseInt(req.params.id), req.body, req.user.idProdutor);
  res.json(lanc);
});

module.exports = router;
