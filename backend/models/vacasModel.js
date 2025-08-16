function getAll(db) {
  return db.prepare('SELECT * FROM vacas').all();
}

function getById(db, id) {
  return db.prepare('SELECT * FROM vacas WHERE id = ?').get(id);
}

function create(db, vaca) {
  const stmt = db.prepare('INSERT INTO vacas (nome, idade, raca) VALUES (?, ?, ?)');
  const info = stmt.run(vaca.nome, vaca.idade, vaca.raca);
  return getById(db, info.lastInsertRowid);
}

function update(db, id, vaca) {
  const stmt = db.prepare('UPDATE vacas SET nome = ?, idade = ?, raca = ? WHERE id = ?');
  stmt.run(vaca.nome, vaca.idade, vaca.raca, id);
  return getById(db, id);
}

function remove(db, id) {
  return db.prepare('DELETE FROM vacas WHERE id = ?').run(id);
}

module.exports = { getAll, getById, create, update, remove };
