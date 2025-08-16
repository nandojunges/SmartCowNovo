const { getDb } = require('../db');

function create(fazenda) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO fazendas (nome, idProdutor, limiteAnimais) VALUES (?, ?, ?)');
  const info = stmt.run(fazenda.nome, fazenda.idProdutor, fazenda.limiteAnimais || 0);
  return getById(info.lastInsertRowid);
}

function getByProdutor(idProdutor) {
  const db = getDb();
  return db.prepare('SELECT * FROM fazendas WHERE idProdutor = ?').get(idProdutor);
}

function getById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM fazendas WHERE id = ?').get(id);
}

function updateLimite(id, limite) {
  const db = getDb();
  db.prepare('UPDATE fazendas SET limiteAnimais = ? WHERE id = ?').run(limite, id);
  return getById(id);
}

module.exports = {
  create,
  getByProdutor,
  getById,
  updateLimite,
};
