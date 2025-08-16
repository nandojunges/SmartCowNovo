const express = require('express');
const router = express.Router();
const Estoque = require('../models/estoqueModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

// Protege todas as rotas
router.use(autenticarToken);

router.get('/', (req, res) => {
  const db = initDB(req.user.email);
  const itens = Estoque.getAll(db, req.user.idProdutor);
  res.json(itens);
});

router.get('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const item = Estoque.getById(db, parseInt(req.params.id), req.user.idProdutor);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const db = initDB(req.user.email);
  const item = Estoque.create(db, req.body, req.user.idProdutor);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const item = Estoque.update(db, parseInt(req.params.id), req.body, req.user.idProdutor);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const db = initDB(req.user.email);
  Estoque.remove(db, parseInt(req.params.id), req.user.idProdutor);
  res.status(204).end();
});

module.exports = router;
