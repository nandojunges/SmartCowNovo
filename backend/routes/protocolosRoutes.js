const express = require('express');
const router = express.Router();
const Protocolos = require('../models/protocolosModel');
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

// Middleware de autenticação para todas as rotas
router.use(autenticarToken);

router.get('/', (req, res) => {
  const db = initDB(req.user.email);
  const protocolos = Protocolos.getAll(db, req.user.idProdutor);
  res.json(protocolos);
});

router.get('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const protocolo = Protocolos.getById(db, parseInt(req.params.id), req.user.idProdutor);
  if (!protocolo) return res.status(404).json({ message: 'Protocolo not found' });
  res.json(protocolo);
});

router.post('/', (req, res) => {
  const db = initDB(req.user.email);
  const protocolo = Protocolos.create(db, req.body, req.user.idProdutor);
  res.status(201).json(protocolo);
});

router.put('/:id', (req, res) => {
  const db = initDB(req.user.email);
  const protocolo = Protocolos.update(db, parseInt(req.params.id), req.body, req.user.idProdutor);
  res.json(protocolo);
});

router.delete('/:id', (req, res) => {
  const db = initDB(req.user.email);
  Protocolos.remove(db, parseInt(req.params.id), req.user.idProdutor);
  res.status(204).end();
});

module.exports = router;
