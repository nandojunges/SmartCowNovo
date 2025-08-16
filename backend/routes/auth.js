const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.cadastro);
router.post('/verify', ctrl.verificarEmail);   // body: { email, codigoDigitado }
router.post('/verify-code', ctrl.verifyCode);   // alias
router.post('/login', ctrl.login);

module.exports = router;