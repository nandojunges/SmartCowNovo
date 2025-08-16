async function getAll(db, idProdutor) {
  return await db
    .prepare('SELECT * FROM tarefas WHERE idProdutor = ?')
    .all(idProdutor);
}

async function getById(db, id, idProdutor) {
  return await db
    .prepare('SELECT * FROM tarefas WHERE id = ? AND idProdutor = ?')
    .get(id, idProdutor);
}

async function create(db, tarefa, idProdutor) {
  const stmt = db.prepare(`
    INSERT INTO tarefas (descricao, data, concluida, idProdutor)
    VALUES (?, ?, ?, ?)
  `);
  const info = await stmt.run(
    tarefa.descricao,
    tarefa.data,
    tarefa.concluida ?? false,
    idProdutor
  );

  return await getById(db, info.lastInsertRowid, idProdutor);
}

async function update(db, id, tarefa, idProdutor) {
  const stmt = db.prepare(`
    UPDATE tarefas
    SET descricao = ?, data = ?, concluida = ?
    WHERE id = ? AND idProdutor = ?
  `);
  await stmt.run(
    tarefa.descricao,
    tarefa.data,
    tarefa.concluida ?? false,
    id,
    idProdutor
  );

  return await getById(db, id, idProdutor);
}

async function remove(db, id, idProdutor) {
  return await db
    .prepare('DELETE FROM tarefas WHERE id = ? AND idProdutor = ?')
    .run(id, idProdutor);
}

module.exports = { getAll, getById, create, update, remove };
