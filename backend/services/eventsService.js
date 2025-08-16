const db = require('./dbAdapter');

async function registrarOcorrencia(idAnimal, dados) {
  await db.run('INSERT INTO health_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'OCORRENCIA',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function registrarTratamento(idAnimal, dados) {
  await db.run('INSERT INTO health_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'TRATAMENTO',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function listarHistorico(idAnimal) {
  return db.query('SELECT * FROM health_events WHERE animal_id=$1 ORDER BY data', [idAnimal]);
}

module.exports = {
  registrarOcorrencia,
  registrarTratamento,
  listarHistorico,
};
