const express = require('express');
const router = express.Router();

router.use('/animais', require('./animaisRoutes'));
router.use('/bezerras', require('./bezerrasRoutes'));
router.use('/estoque', require('./estoqueRoutes'));
router.use('/tarefas', require('./tarefasRoutes'));
router.use('/vacas', require('./vacasRoutes'));
router.use('/protocolos-reprodutivos', require('./protocolosRoutes'));
router.use('/reproducao', require('./reproducaoRoutes'));
router.use('/financeiro', require('./financeiroRoutes'));
router.use('/eventos', require('./eventosRoutes'));
router.use('/produtos', require('./produtosRoutes'));
router.use('/examesSanitarios', require('./examesSanitariosRoutes'));
router.use('/racas', require('./racasRoutes'));
router.use('/usuario', require('./usuarioRoutes'));
router.use('/', require('./mockRoutes'));
router.use('/', require('./adminRoutes'));

module.exports = router;
