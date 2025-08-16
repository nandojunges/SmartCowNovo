const db = require('./dbAdapter');

function addDerived(animal) {
  if (!animal) return animal;
  const today = new Date();
  if (animal.parto) {
    const partoDate = new Date(animal.parto);
    const diff = Math.floor((today - partoDate) / (1000 * 60 * 60 * 24));
    animal.del = diff;
    const secagem = new Date(partoDate);
    secagem.setDate(secagem.getDate() + 305);
    animal.previsao_secagem = secagem.toISOString().slice(0, 10);
  }
  if (animal.ultima_ia && !animal.previsao_parto) {
    const partoPrev = new Date(animal.ultima_ia);
    partoPrev.setDate(partoPrev.getDate() + 280);
    animal.previsao_parto = partoPrev.toISOString().slice(0, 10);
  }
  return animal;
}

function applyDerivedOnArray(array) {
  return (array || []).map(addDerived);
}

function shouldPromoteToPreParto(animal, today = new Date(), windowDays = +process.env.PREPARTO_WINDOW_DAYS || 21) {
  if (!animal?.previsao_parto) return false;
  const dpp = new Date(animal.previsao_parto);
  const limite = new Date(dpp); limite.setDate(limite.getDate() - windowDays);
  return animal.estado === 'gestante' && today >= limite;
}

async function promoteToPrePartoIfDue(id) {
  const a = await getById(id);
  if (!a) return {updated:false};
  if (!shouldPromoteToPreParto(a)) return {updated:false};
  await db.run('UPDATE animals SET estado=$1 WHERE id=$2', ['preparto', id]);
  return {updated:true, id};
}

async function promoteBatchPreParto(today = new Date()) {
  const gestantes = await db.query('SELECT * FROM animals WHERE estado=$1', ['gestante']);
  const ids = [];
  for (const g of gestantes) {
    if (shouldPromoteToPreParto(g, today)) {
      await db.run('UPDATE animals SET estado=$1 WHERE id=$2', ['preparto', g.id]);
      ids.push(g.id);
    }
  }
  return {count: ids.length, ids};
}

async function list(params = {}) {
  let sql = 'SELECT * FROM animals';
  const args = [];
  if (params.estado) {
    args.push(params.estado);
    sql += ' WHERE estado=$1';
  }
  const animais = await db.query(sql, args);
  return applyDerivedOnArray(animais);
}

async function getById(id) {
  const rows = await db.query('SELECT * FROM animals WHERE id=$1', [id]);
  return addDerived(rows[0]);
}

async function create(animal) {
  const cols = ['numero','brinco','nascimento','raca','estado','ultima_ia','diagnostico_data','diagnostico_resultado','previsao_parto','parto','secagem'];
  const keys = [];
  const values = [];
  const params = [];
  let idx = 1;
  for (const col of cols) {
    if (animal[col] !== undefined) {
      keys.push(col);
      values.push(`$${idx++}`);
      params.push(animal[col]);
    }
  }
  const rows = await db.query(`INSERT INTO animals (${keys.join(',')}) VALUES (${values.join(',')}) RETURNING *`, params);
  return rows[0];
}

async function update(id, animal) {
  const entries = Object.entries(animal);
  const sets = entries.map(([k], i) => `${k}=$${i+1}`);
  const params = entries.map(([,v]) => v);
  params.push(id);
  await db.run(`UPDATE animals SET ${sets.join(',')} WHERE id=$${entries.length+1}`, params);
  const rows = await db.query('SELECT * FROM animals WHERE id=$1', [id]);
  return rows[0];
}

async function remove(id) {
  await db.run('DELETE FROM animals WHERE id=$1', [id]);
}

async function onInseminada(id, { data }) {
  let previsao = null;
  if (data) {
    const prev = new Date(data);
    prev.setDate(prev.getDate() + 280);
    previsao = prev.toISOString().slice(0, 10);
  }
  await db.run('UPDATE animals SET ultima_ia=$1, previsao_parto=$2 WHERE id=$3', [data, previsao, id]);
}

async function onDiagnostico(id, { resultado, data }) {
  const estado = resultado === 'positivo' ? 'gestante' : 'vazia';
  await db.run('UPDATE animals SET diagnostico_data=$1, diagnostico_resultado=$2, estado=$3 WHERE id=$4', [data, resultado, estado, id]);
}

async function onPreParto(id) {
  await db.run('UPDATE animals SET estado=$1 WHERE id=$2', ['preparto', id]);
}

async function onParto(id, data) {
  await db.run('UPDATE animals SET estado=$1, parto=$2 WHERE id=$3', ['lactante', data, id]);
}

async function onSecagem(id, data) {
  await db.run('UPDATE animals SET estado=$1, secagem=$2 WHERE id=$3', ['seca', data, id]);
}

async function onDescartar(id) {
  await db.run('UPDATE animals SET estado=$1 WHERE id=$2', ['inativa', id]);
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  applyDerivedOnArray,
  onInseminada,
  onDiagnostico,
  onPreParto,
  onParto,
  onSecagem,
  onDescartar,
  shouldPromoteToPreParto,
  promoteToPrePartoIfDue,
  promoteBatchPreParto,
};
