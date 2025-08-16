function getByNumero(db, numero, idProdutor) {
  const row = db
    .prepare('SELECT dados FROM reproducao WHERE numero = ? AND idProdutor = ?')
    .get(numero, idProdutor);
  return row ? JSON.parse(row.dados) : { ocorrencias: [] };
}

function upsert(db, numero, dados, idProdutor) {
  const stmt = db.prepare(
    `INSERT INTO reproducao (numero, dados, idProdutor) VALUES (?, ?, ?)
    ON CONFLICT(numero) DO UPDATE SET dados=excluded.dados, idProdutor=excluded.idProdutor`
  );
  stmt.run(numero, JSON.stringify(dados), idProdutor);
  return getByNumero(db, numero, idProdutor);
}

function getReproducaoAnimal(db, numero, idProdutor) {
  return getByNumero(db, numero, idProdutor);
}

function registrarIA(db, dados, idProdutor) {
  if (!dados || !dados.numero) return null;
  const registro = getByNumero(db, dados.numero, idProdutor);
  registro.ocorrencias = registro.ocorrencias || [];
  registro.ocorrencias.push(dados);
  return upsert(db, dados.numero, registro, idProdutor);
}

function registrarDiagnostico(db, dados, idProdutor) {
  return registrarIA(db, dados, idProdutor);
}

module.exports = {
  getByNumero,
  upsert,
  getReproducaoAnimal,
  registrarIA,
  registrarDiagnostico,
};
