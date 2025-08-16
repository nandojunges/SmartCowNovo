const express = require('express');
const animalsController = require('../controllers/animalsController');
const reproductionController = require('../controllers/reproductionController');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.post('/api/v1/animais', animalsController.create);
router.get('/api/v1/animais', animalsController.list); // filtros: ?estado=&q=&page=&limit=
router.get('/api/v1/animais/:id', animalsController.getById);
router.put('/api/v1/animais/:id', animalsController.update);
router.delete('/api/v1/animais/:id', animalsController.remove);

router.post('/api/v1/reproducao/:id/inseminacoes', reproductionController.registrarInseminacao);
router.post('/api/v1/reproducao/:id/diagnosticos', reproductionController.registrarDiagnostico);
router.post('/api/v1/reproducao/:id/partos', reproductionController.registrarParto);
router.post('/api/v1/reproducao/:id/secagens', reproductionController.registrarSecagem);
router.get('/api/v1/reproducao/:id/historico', reproductionController.listarHistorico);

router.post('/api/v1/saude/:id/ocorrencias', healthController.registrarOcorrencia);
router.post('/api/v1/saude/:id/tratamentos', healthController.registrarTratamento);
router.get('/api/v1/saude/:id/historico', healthController.listarHistorico);

module.exports = router;
