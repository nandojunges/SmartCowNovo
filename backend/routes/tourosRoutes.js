const express = require('express');
const router = express.Router();
const autenticarToken = require('../middleware/autenticarToken');
const controller = require('../controllers/tourosController');

// Rota protegida para listar touros do produtor
router.get('/', autenticarToken, controller.listar);

// Rota protegida para cadastrar uma ficha de touro
router.post('/', autenticarToken, controller.cadastrar);

module.exports = router;

