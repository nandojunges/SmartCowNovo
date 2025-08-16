function getAll(db, idProdutor) {
  return db.prepare('SELECT * FROM protocolos_reprodutivos WHERE idProdutor = ?').all(idProdutor);
}

function getById(db, id, idProdutor) {
  return db.prepare('SELECT * FROM protocolos_reprodutivos WHERE id = ? AND idProdutor = ?').get(id, idProdutor);
}

function create(db, protocolo, idProdutor) {
  const stmt = db.prepare('INSERT INTO protocolos_reprodutivos (nome, descricao, idProdutor) VALUES (?, ?, ?)');
  const info = stmt.run(protocolo.nome, protocolo.descricao, idProdutor);
  return getById(db, info.lastInsertRowid, idProdutor);
}

function update(db, id, protocolo, idProdutor) {
  const stmt = db.prepare('UPDATE protocolos_reprodutivos SET nome = ?, descricao = ? WHERE id = ? AND idProdutor = ?');
  stmt.run(protocolo.nome, protocolo.descricao, id, idProdutor);
  return getById(db, id, idProdutor);
}

function remove(db, id, idProdutor) {
  return db.prepare('DELETE FROM protocolos_reprodutivos WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = { getAll, getById, create, update, remove };
