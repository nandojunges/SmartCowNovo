const express = require('express');
const router = express.Router();
const autenticarToken = require('../middleware/autenticarToken');
const controller = require('../controllers/eventosController');

// Lista todos os eventos do produtor
router.get('/', autenticarToken, controller.listarTodos);

// Lista eventos do animal (linha do tempo)
router.get('/:animal_id', autenticarToken, controller.listarPorAnimal);
module.exports = router;
