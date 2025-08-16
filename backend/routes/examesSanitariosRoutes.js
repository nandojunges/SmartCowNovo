const express = require('express');
const router = express.Router();
const Exames = require('../models/examesSanitariosModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

router.use(autenticarToken);

router.get('/', (req, res) => {
  const db = initDB(req.user.email);
  res.json(Exames.getAll(db, req.user.idProdutor));
});

router.get('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const item = Exames.getById(db, parseInt(req.params.id), req.user.idProdutor);
  if (!item) return res.status(404).json({ message: 'Registro not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const db = initDB(req.user.email);
  const item = Exames.create(db, req.body, req.user.idProdutor);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const item = Exames.update(db, parseInt(req.params.id), req.body, req.user.idProdutor);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const db = initDB(req.user.email);
  Exames.remove(db, parseInt(req.params.id), req.user.idProdutor);
  res.status(204).end();
});

module.exports = router;
