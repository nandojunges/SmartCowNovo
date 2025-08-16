const express = require('express');
const router = express.Router();
const Vacas = require('../models/vacasModel');

router.get('/', (req, res) => {
  const vacas = Vacas.getAll();
  res.json(vacas);
});

router.get('/:id', (req, res) => {
  const vaca = Vacas.getById(req.params.id);
  if (!vaca) return res.status(404).json({ message: 'Vaca not found' });
  res.json(vaca);
});

router.post('/', (req, res) => {
  const vaca = Vacas.create(req.body);
  res.status(201).json(vaca);
});

router.put('/:id', (req, res) => {
  const vaca = Vacas.update(req.params.id, req.body);
  res.json(vaca);
});

router.delete('/:id', (req, res) => {
  Vacas.remove(req.params.id);
  res.status(204).end();
});

module.exports = router;

