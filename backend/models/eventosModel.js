// Modelo para eventos (linha do tempo dos animais)
function create(db, dados, idProdutor) {
  const stmt = db.prepare(`
    INSERT INTO eventos (animal_id, dataEvento, tipoEvento, descricao, idProdutor)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    dados.animal_id,
    dados.dataEvento,
    dados.tipoEvento,
    dados.descricao || '',
    idProdutor
  );
  return { id: info.lastInsertRowid, ...dados, idProdutor };
}

function getByAnimal(db, animal_id, idProdutor) {
  let coluna = 'animal_id';
  const info = db.prepare("PRAGMA table_info(eventos)").all();
  if (!info.some(c => c.name === 'animal_id') && info.some(c => c.name === 'idAnimal')) {
    coluna = 'idAnimal';
  }
  return db.prepare(
    `SELECT * FROM eventos WHERE ${coluna} = ? AND idProdutor = ? ORDER BY dataEvento DESC`
  ).all(animal_id, idProdutor);
}
function getAll(db, idProdutor) {
  return db
    .prepare(
      'SELECT * FROM eventos WHERE idProdutor = ? ORDER BY dataEvento DESC'
    )
    .all(idProdutor);
}

module.exports = { create, getByAnimal, getAll };
