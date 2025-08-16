const { initDB } = require('../db');
const Touros = require('../models/tourosModel');

// Lista todas as fichas de touros do produtor logado
function listar(req, res) {
  const db = initDB(req.user.email);
  try {
    const touros = Touros.getAll(db, req.user.idProdutor);
    res.json(touros);
  } catch (err) {
    console.error('Erro ao listar touros:', err);
    res.status(500).json({ message: 'Erro ao listar touros' });
  }
}

// Cadastra uma ficha de touro (PDF extraído) para o produtor logado
function cadastrar(req, res) {
  const db = initDB(req.user.email);
  const dados = req.body;
  try {
    const criado = Touros.create(db, dados, req.user.idProdutor);
    res.status(201).json(criado);
  } catch (err) {
    console.error('Erro ao cadastrar touro:', err);
    res.status(500).json({ message: 'Erro ao cadastrar touro' });
  }
}

module.exports = {
  listar,
  cadastrar,
};

