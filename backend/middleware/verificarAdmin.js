const jwt = require('jsonwebtoken');
const { initDB } = require('../db');

const SECRET = process.env.JWT_SECRET || 'segredo';

module.exports = async function verificarAdmin(req, res, next) {
  try {
    let usuarioJwt = req.user;
    if (!usuarioJwt) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      usuarioJwt = jwt.verify(token, SECRET);
    }

    const db = initDB(usuarioJwt.email);
    req.usuario = db
      .prepare('SELECT * FROM usuarios WHERE id = ?')
      .get(usuarioJwt.idProdutor);

    if (!req.usuario || (req.usuario.perfil !== 'admin' && req.usuario.tipoConta !== 'admin')) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito a administradores' });
    }
    next();
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
