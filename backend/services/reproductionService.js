const db = require('./dbAdapter');

async function registrarInseminacao(idAnimal, dados) {
  await db.run('INSERT INTO repro_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'IA',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function registrarDiagnostico(idAnimal, dados) {
  await db.run('INSERT INTO repro_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'DIAGNOSTICO',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function registrarParto(idAnimal, dados) {
  await db.run('INSERT INTO repro_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'PARTO',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function registrarSecagem(idAnimal, dados) {
  await db.run('INSERT INTO repro_events (animal_id,tipo,data,payload) VALUES ($1,$2,$3,$4)', [
    idAnimal,
    'SECAGEM',
    dados.data,
    JSON.stringify(dados.payload || {}),
  ]);
}

async function listarHistorico(idAnimal) {
  return db.query('SELECT * FROM repro_events WHERE animal_id=$1 ORDER BY data', [idAnimal]);
}

module.exports = {
  registrarInseminacao,
  registrarDiagnostico,
  registrarParto,
  registrarSecagem,
  listarHistorico,
};
