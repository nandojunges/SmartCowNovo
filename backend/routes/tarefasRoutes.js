const express = require('express');
const router = express.Router();
const { initDB } = require('../db');
const Tarefas = require('../models/tarefasModel');
const autenticarToken = require('../middleware/autenticarToken');

// Protege todas as rotas com autenticação
router.use(autenticarToken);

// GET /tarefas → listar todas as tarefas do produtor
router.get('/', async (req, res) => {
  const db = initDB(req.user.email);
  const tarefas = await Tarefas.getAll(db, req.user.idProdutor);
  res.json(tarefas);
});

// GET /tarefas/:id → buscar uma tarefa específica
router.get('/:id', async (req, res) => {
  const db = initDB(req.user.email);
  const tarefa = await Tarefas.getById(db, parseInt(req.params.id), req.user.idProdutor);
  if (!tarefa) return res.status(404).json({ message: 'Tarefa não encontrada' });
  res.json(tarefa);
});

// POST /tarefas → criar nova tarefa
router.post('/', async (req, res) => {
  const db = initDB(req.user.email);
  const tarefa = await Tarefas.create(db, req.body, req.user.idProdutor);
  res.status(201).json(tarefa);
});

// PUT /tarefas/:id → editar tarefa
router.put('/:id', async (req, res) => {
  const db = initDB(req.user.email);
  const tarefa = await Tarefas.update(db, parseInt(req.params.id), req.body, req.user.idProdutor);
  res.json(tarefa);
});

// DELETE /tarefas/:id → remover tarefa
router.delete('/:id', async (req, res) => {
  const db = initDB(req.user.email);
  await Tarefas.remove(db, parseInt(req.params.id), req.user.idProdutor);
  res.status(204).end();
});

module.exports = router;
