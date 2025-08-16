const reproductionService = require('../services/reproductionService');
const animalsService = require('../services/animalsService');
const { requireFields, isDate } = require('../utils/validate');

async function registrarInseminacao(req, res, next) {
  try {
    const check = requireFields(req.body, ['data']);
    if (!check.ok || (req.body.data && !isDate(req.body.data))) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos' });
    }
    const result = await reproductionService.registrarInseminacao(
      Number(req.params.id),
      req.body
    );
    await animalsService.onInseminada(Number(req.params.id), req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function registrarDiagnostico(req, res, next) {
  try {
    const check = requireFields(req.body, ['data']);
    if (!check.ok || (req.body.data && !isDate(req.body.data))) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos' });
    }
    const result = await reproductionService.registrarDiagnostico(
      Number(req.params.id),
      req.body
    );
    await animalsService.onDiagnostico(Number(req.params.id), req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function registrarParto(req, res, next) {
  try {
    const check = requireFields(req.body, ['data']);
    if (!check.ok || (req.body.data && !isDate(req.body.data))) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos' });
    }
    const result = await reproductionService.registrarParto(
      Number(req.params.id),
      req.body
    );
    await animalsService.onParto(Number(req.params.id), req.body.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function registrarSecagem(req, res, next) {
  try {
    const check = requireFields(req.body, ['data']);
    if (!check.ok || (req.body.data && !isDate(req.body.data))) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos' });
    }
    const result = await reproductionService.registrarSecagem(
      Number(req.params.id),
      req.body
    );
    await animalsService.onSecagem(Number(req.params.id), req.body.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function listarHistorico(req, res, next) {
  try {
    const historico = await reproductionService.listarHistorico(Number(req.params.id));
    res.json(historico);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrarInseminacao,
  registrarDiagnostico,
  registrarParto,
  registrarSecagem,
  listarHistorico,
};
