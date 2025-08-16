const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const autenticar = require('../middleware/autenticarToken');

router.post('/register', controller.register);
router.post('/verify', controller.verificarCodigo);
router.post('/login', controller.login);
router.get('/dados', autenticar, controller.dados);
router.get('/usuarios', controller.listarUsuarios);

module.exports = router;