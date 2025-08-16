function map(row) {
  return row ? { id: row.id, ...JSON.parse(row.dados) } : null;
}

function getAll(db, idProdutor) {
  return db.prepare('SELECT id, dados FROM produtos WHERE idProdutor = ?').all(idProdutor).map(map);
}

function buscarTodosProdutos(db, idProdutor) {
  return getAll(db, idProdutor);
}

function getById(db, id, idProdutor) {
  const row = db.prepare('SELECT id, dados FROM produtos WHERE id = ? AND idProdutor = ?').get(id, idProdutor);
  return map(row);
}

function create(db, item, idProdutor) {
  const stmt = db.prepare('INSERT INTO produtos (dados, idProdutor) VALUES (?, ?)');
  const info = stmt.run(JSON.stringify(item), idProdutor);
  return getById(db, info.lastInsertRowid, idProdutor);
}

function update(db, id, item, idProdutor) {
  const stmt = db.prepare('UPDATE produtos SET dados = ? WHERE id = ? AND idProdutor = ?');
  stmt.run(JSON.stringify(item), id, idProdutor);
  return getById(db, id, idProdutor);
}

function remove(db, id, idProdutor) {
  db.prepare('DELETE FROM produtos WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = { getAll, buscarTodosProdutos, getById, create, update, remove };
