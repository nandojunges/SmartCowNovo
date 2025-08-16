function getAll(db, idProdutor) {
  return db.prepare('SELECT * FROM estoque WHERE idProdutor = ?').all(idProdutor);
}

function getById(db, id, idProdutor) {
  return db.prepare('SELECT * FROM estoque WHERE id = ? AND idProdutor = ?').get(id, idProdutor);
}

function create(db, item, idProdutor) {
  const stmt = db.prepare('INSERT INTO estoque (item, quantidade, unidade, idProdutor) VALUES (?, ?, ?, ?)');
  const info = stmt.run(item.item, item.quantidade, item.unidade, idProdutor);
  return getById(db, info.lastInsertRowid, idProdutor);
}

function update(db, id, item, idProdutor) {
  const stmt = db.prepare('UPDATE estoque SET item = ?, quantidade = ?, unidade = ? WHERE id = ? AND idProdutor = ?');
  stmt.run(item.item, item.quantidade, item.unidade, id, idProdutor);
  return getById(db, id, idProdutor);
}

function remove(db, id, idProdutor) {
  return db.prepare('DELETE FROM estoque WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = { getAll, getById, create, update, remove };
