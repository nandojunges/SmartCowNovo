function map(row) {
  return row ? { id: row.id, ...JSON.parse(row.dados) } : null;
}

function getAll(db, idProdutor) {
  return db.prepare('SELECT id, dados FROM exames_sanitarios WHERE idProdutor = ?').all(idProdutor).map(map);
}

function buscarTodosExames(db, idProdutor) {
  return getAll(db, idProdutor);
}

function getById(db, id, idProdutor) {
  const row = db.prepare('SELECT id, dados FROM exames_sanitarios WHERE id = ? AND idProdutor = ?').get(id, idProdutor);
  return map(row);
}

function create(db, item, idProdutor) {
  const stmt = db.prepare('INSERT INTO exames_sanitarios (dados, idProdutor) VALUES (?, ?)');
  const info = stmt.run(JSON.stringify(item), idProdutor);
  return getById(db, info.lastInsertRowid, idProdutor);
}

function update(db, id, item, idProdutor) {
  const stmt = db.prepare('UPDATE exames_sanitarios SET dados = ? WHERE id = ? AND idProdutor = ?');
  stmt.run(JSON.stringify(item), id, idProdutor);
  return getById(db, id, idProdutor);
}

function remove(db, id, idProdutor) {
  db.prepare('DELETE FROM exames_sanitarios WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = { getAll, buscarTodosExames, getById, create, update, remove };
