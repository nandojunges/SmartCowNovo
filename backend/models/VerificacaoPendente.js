// backend/models/VerificacaoPendente.js

// ➤ Cria novo registro de verificação pendente
function create(db, dados) {
  const stmt = db.prepare(`
    INSERT INTO verificacoes_pendentes (
      email, codigo, nome, nomeFazenda, telefone, senha,
      planoSolicitado, formaPagamento, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    dados.email,
    dados.codigo,
    dados.nome,
    dados.nomeFazenda,
    dados.telefone,
    dados.senha,
    dados.planoSolicitado,
    dados.formaPagamento,
    dados.criado_em
  );

  return getById(db, info.lastInsertRowid);
}

// ➤ Busca por e-mail
function getByEmail(db, email) {
  if (!email || typeof email !== 'string') {
    throw new Error(`Email inválido no getByEmail: ${email}`);
  }

  return db
    .prepare('SELECT * FROM verificacoes_pendentes WHERE email = ?')
    .get(email);
}

// ➤ Lista todas as verificações pendentes
function getAll(db) {
  return db.prepare('SELECT * FROM verificacoes_pendentes').all();
}

// ➤ Atualiza registro existente por e-mail
function updateByEmail(db, email, dados) {
  db.prepare(`
    UPDATE verificacoes_pendentes
    SET codigo = ?, nome = ?, nomeFazenda = ?, telefone = ?, senha = ?,
        planoSolicitado = ?, formaPagamento = ?, criado_em = ?
    WHERE email = ?
  `).run(
    dados.codigo,
    dados.nome,
    dados.nomeFazenda,
    dados.telefone,
    dados.senha,
    dados.planoSolicitado,
    dados.formaPagamento,
    dados.criado_em,
    email
  );
}

// ➤ Remove registro por e-mail
function deleteByEmail(db, email) {
  db.prepare('DELETE FROM verificacoes_pendentes WHERE email = ?').run(email);
}

// Alias mais intuitivo
function deletar(db, email) {
  deleteByEmail(db, email);
}

// ➤ Limpa registros que passaram de 3 minutos (expirados)
function limparExpirados(db) {
  db
    .prepare(
      "DELETE FROM verificacoes_pendentes WHERE criado_em < datetime('now', '-10 minutes')"
    )
    .run();
}

// ➤ Busca por ID
function getById(db, id) {
  return db.prepare('SELECT * FROM verificacoes_pendentes WHERE id = ?').get(id);
}

module.exports = {
  create,
  getByEmail,
  getAll,
  updateByEmail,
  deleteByEmail,
  deletar,
  limparExpirados,
  getById,
};
