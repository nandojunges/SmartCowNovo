// backend/routes/animaisRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const animaisController = require('../controllers/animaisController');
const { initDB } = require('../db');
const animaisModel = require('../models/animaisModel');

// ✅ Aplica autenticação em todas as rotas
router.use(authMiddleware);

// 🔎 Listar todos os animais
router.get('/', animaisController.listarAnimais);

// 🔎 Buscar por número (deve vir antes do :id)
router.get('/numero/:numero', async (req, res) => {
  const db = initDB(req.user.email);
  try {
    const animal = await animaisModel.getByNumero(
      db,
      parseInt(req.params.numero),
      req.user.idProdutor
    );
    if (!animal) return res.status(404).json({ message: 'Animal não encontrado' });
    res.json(animal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar animal por número' });
  }
});

// 🔎 Buscar por ID
router.get('/:id', animaisController.buscarAnimalPorId);

// ➕ Cadastrar novo animal
router.post('/', async (req, res, next) => {
  const db = initDB(req.user.email);
  const numero = parseInt(req.body.numero);
  const existente = await animaisModel.getByNumero(db, numero, req.user.idProdutor);
  if (existente) {
    return res.status(400).json({ erro: 'Número já cadastrado' });
  }
  next();
}, animaisController.adicionarAnimal);

// ✏️ Editar animal
router.put('/:id', animaisController.editarAnimal);

// ❌ Excluir animal
router.delete('/:id', animaisController.excluirAnimal);
// aplica secagem ao animal
router.post('/:id/secagem', animaisController.aplicarSecagem);
// registra parto do animal
router.post('/:id/parto', animaisController.registrarParto);

module.exports = router;