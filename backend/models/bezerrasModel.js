function getTodasBezerras(db, idProdutor) {
  return db.prepare('SELECT * FROM bezerras WHERE idProdutor = ?').all(idProdutor);
}

function salvarBezerra(db, dados, idProdutor) {
  const insert = db.prepare('INSERT INTO bezerras (nome, idProdutor) VALUES (?, ?)');
  const update = db.prepare('UPDATE bezerras SET nome = ? WHERE id = ? AND idProdutor = ?');

  if (Array.isArray(dados)) {
    dados.forEach((b) => {
      if (b.id) {
        update.run(b.nome, b.id, idProdutor);
      } else {
        insert.run(b.nome, idProdutor);
      }
    });
  } else if (dados && typeof dados === 'object') {
    if (dados.id) {
      update.run(dados.nome, dados.id, idProdutor);
    } else {
      insert.run(dados.nome, idProdutor);
    }
  }

  return getTodasBezerras(db, idProdutor);
}

function removerBezerraPorId(db, id, idProdutor) {
  return db.prepare('DELETE FROM bezerras WHERE id = ? AND idProdutor = ?').run(id, idProdutor);
}

module.exports = {
  getTodasBezerras,
  salvarBezerra,
  removerBezerraPorId,
};
