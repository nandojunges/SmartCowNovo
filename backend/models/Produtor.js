const { getDb } = require('../db');

async function create(produtor) {
  const db = getDb();
  const stmt = db.prepare(`INSERT INTO produtores (nome, email, senha, emailVerificado, codigoVerificacao, status) VALUES (?, ?, ?, ?, ?, ?)`);
  const info = await stmt.run(
    produtor.nome,
    produtor.email,
    produtor.senha,
    produtor.emailVerificado ?? false,
    produtor.codigoVerificacao,
    produtor.status || 'ativo'
  );
  return await getById(info.lastInsertRowid);
}

async function getByEmail(email) {
  const db = getDb();
  return await db.prepare('SELECT * FROM produtores WHERE email = ?').get(email);
}

async function getById(id) {
  const db = getDb();
  return await db.prepare('SELECT * FROM produtores WHERE id = ?').get(id);
}

async function marcarVerificado(id) {
  const db = getDb();
  await db
    .prepare('UPDATE produtores SET emailVerificado = ?, codigoVerificacao = NULL WHERE id = ?')
    .run(true, id);
}

async function definirCodigo(id, codigo) {
  const db = getDb();
  await db.prepare('UPDATE produtores SET codigoVerificacao = ? WHERE id = ?').run(codigo, id);
}

async function atualizarSenha(id, senha) {
  const db = getDb();
  await db.prepare('UPDATE produtores SET senha = ?, codigoVerificacao = NULL WHERE id = ?').run(senha, id);
}

async function getAll() {
  const db = getDb();
  return await db.prepare('SELECT * FROM produtores').all();
}

async function getAllComFazendas() {
  const db = getDb();
  return await db.prepare(`
    SELECT p.id, p.nome, p.email, p.status,
           f.id AS fazendaId, f.nome AS fazendaNome, f.limiteAnimais,
           (SELECT COUNT(*) FROM animais a WHERE a.idProdutor = p.id) AS totalAnimais
      FROM produtores p
      LEFT JOIN fazendas f ON f.idProdutor = p.id
  `).all();
}

async function updateStatus(id, status) {
  const db = getDb();
  await db.prepare('UPDATE produtores SET status = ? WHERE id = ?').run(status, id);
  return await getById(id);
}

module.exports = {
  create,
  getByEmail,
  getById,
  marcarVerificado,
  getAll,
  getAllComFazendas,
  updateStatus,
  definirCodigo,
  atualizarSenha,
};
