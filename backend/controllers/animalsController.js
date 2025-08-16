const animalsService = require('../services/animalsService');
const { requireFields, isDate } = require('../utils/validate');

async function list(req, res, next) {
  try {
    const { estado, q, page, limit } = req.query;
    const animals = await animalsService.list({ estado, q, page, limit });
    res.json(animals);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const animal = await animalsService.getById(Number(req.params.id));
    if (!animal) return res.status(404).json({ error: 'Animal não encontrado' });
    res.json(animal);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos', code: 400 });
    }
    const check = requireFields(req.body, ['numero']);
    if (!check.ok) {
      return res.status(400).json({ ok: false, message: 'Campos obrigatórios ausentes', missing: check.missing });
    }
    if (req.body.nascimento && !isDate(req.body.nascimento)) {
      return res.status(400).json({ ok: false, message: 'Data inválida: nascimento' });
    }
    const novo = await animalsService.create(req.body);
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ ok: false, message: 'Dados inválidos', code: 400 });
    }
    const check = requireFields(req.body, ['numero']);
    if (!check.ok) {
      return res.status(400).json({ ok: false, message: 'Campos obrigatórios ausentes', missing: check.missing });
    }
    if (req.body.nascimento && !isDate(req.body.nascimento)) {
      return res.status(400).json({ ok: false, message: 'Data inválida: nascimento' });
    }
    const atualizado = await animalsService.update(Number(req.params.id), req.body);
    res.json(atualizado);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await animalsService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
