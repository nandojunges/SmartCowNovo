const { initDB } = require('../db');
const Eventos = require('../models/eventosModel');

function listarTodos(req, res) {
  const db = initDB(req.user.email);
  try {
    const eventos = Eventos.getAll(db, req.user.idProdutor);
    res.json(eventos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar eventos' });
  }
}

function listarPorAnimal(req, res) {
  const db = initDB(req.user.email);
  const { animal_id } = req.params;
  try {
    const eventos = Eventos.getByAnimal(db, animal_id, req.user.idProdutor);
    res.json(eventos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar eventos' });
  }
}

module.exports = { listarPorAnimal, listarTodos };
