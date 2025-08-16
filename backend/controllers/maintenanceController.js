const animalsService = require('../services/animalsService');

module.exports.promotePreParto = async (req, res, next) => {
  try {
    const result = await animalsService.promoteBatchPreParto();
    return res.json({ ok: true, ...result });
  } catch (e) { next(e); }
};
