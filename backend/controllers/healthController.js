const eventsService = require('../services/eventsService');

async function registrarOcorrencia(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const result = await eventsService.registrarOcorrencia(
      Number(req.params.id),
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function registrarTratamento(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const result = await eventsService.registrarTratamento(
      Number(req.params.id),
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function listarHistorico(req, res, next) {
  try {
    const historico = await eventsService.listarHistorico(Number(req.params.id));
    res.json(historico);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrarOcorrencia,
  registrarTratamento,
  listarHistorico,
};
