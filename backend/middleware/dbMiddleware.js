const { initDB } = require('../db');
const { backupDatabase } = require('../utils/backupUtils');

/**
 * Middleware que carrega o banco do usuário logado e anexa a instância em req.db.
 * Também dispara o backup diário na primeira operação de escrita do dia.
 * Deve ser usado logo após o middleware de autenticação.
 */
module.exports = async function dbMiddleware(req, res, next) {
  try {
    req.db = initDB(req.user.email);

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      await backupDatabase(req.user.email);
    }

    next();
  } catch (err) {
    next(err);
  }
};

