function getAll(db, idProdutor) {
  return db.prepare('SELECT * FROM financeiro WHERE idProdutor = ?').all(idProdutor);
}

function getById(db, id, idProdutor) {
  return db.prepare('SELECT * FROM financeiro WHERE id = ? AND idProdutor = ?').get(id, idProdutor);
}

function create(db, lanc, idProdutor) {
  const stmt = db.prepare(`INSERT INTO financeiro (data, descricao, valor, tipo, categoria, subcategoria, origem, numeroAnimal, centroCusto, idProdutor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(lanc.data, lanc.descricao, lanc.valor, lanc.tipo, lanc.categoria, lanc.subcategoria, lanc.origem, lanc.numeroAnimal, lanc.centroCusto, idProdutor);
  return getById(db, info.lastInsertRowid, idProdutor);
}

function update(db, id, lanc, idProdutor) {
  const stmt = db.prepare(`UPDATE financeiro SET data=?, descricao=?, valor=?, tipo=?, categoria=?, subcategoria=?, origem=?, numeroAnimal=?, centroCusto=? WHERE id=? AND idProdutor = ?`);
  stmt.run(lanc.data, lanc.descricao, lanc.valor, lanc.tipo, lanc.categoria, lanc.subcategoria, lanc.origem, lanc.numeroAnimal, lanc.centroCusto, id, idProdutor);
  return getById(db, id, idProdutor);
}

function remove(db, id, idProdutor) {
  return db.prepare('DELETE FROM financeiro WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = { getAll, getById, create, update, remove };
