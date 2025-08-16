// backend/models/Usuario.js
const fs = require('fs');
const path = require('path');
const { getUserDir } = require('../db');

function dirSemCriar(email) {
  return path.join(__dirname, '..', 'data', email.replace(/[@.]/g, '_'));
}

async function getAll(db) {
  const stmt = db.prepare(`
      SELECT
        id,
        nome,
        nomeFazenda,
        email,
        telefone,
        verificado,
        perfil
      FROM usuarios
    `);
  return await stmt.all();
}

async function create(db, usuario) {
  const stmt = db.prepare(`
    INSERT INTO usuarios (
      nome,
      nomeFazenda,
      email,
      telefone,
      senha,
      verificado,
      codigoVerificacao,
      perfil,
      tipoConta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = await stmt.run(
    usuario.nome,
    usuario.nomeFazenda,
    usuario.email,
    usuario.telefone,
    usuario.senha,
    usuario.verificado ?? false,
    usuario.codigoVerificacao,
    usuario.perfil || 'funcionario', // padrão
    usuario.tipoConta || usuario.perfil || 'usuario'
  );

  const novo = await getById(db, info.lastInsertRowid);
  try {
    const dir = getUserDir(usuario.email);
    fs.writeFileSync(
      path.join(dir, 'usuario.json'),
      JSON.stringify({ id: novo.id, email: novo.email }, null, 2)
    );
  } catch (err) {
    console.error('Erro ao criar usuario.json:', err.message);
  }

  return novo;
}

async function getByEmail(db, email) {
  console.log('🔍 Verificando usuário pelo e-mail:', email);
  const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
  const usuario = await stmt.get(email);
  console.log('📦 Retorno do banco:', usuario);
  return usuario;
}

async function existeNoBanco(db, email) {
  const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
  return await stmt.get(email);
}

async function getById(db, id) {
  const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
  return await stmt.get(id);
}

async function marcarVerificado(db, id) {
  const stmt = db.prepare('UPDATE usuarios SET verificado = ?, codigoVerificacao = NULL WHERE id = ?');
  await stmt.run(true, id);
}

// Marca usuário como verificado usando o e-mail
async function marcarComoVerificado(db, email) {
  const stmt = db.prepare('UPDATE usuarios SET verificado = ?, codigoVerificacao = NULL WHERE email = ?');
  await stmt.run(true, email);
}

async function definirCodigo(db, id, codigo) {
  const stmt = db.prepare('UPDATE usuarios SET codigoVerificacao = ? WHERE id = ?');
  await stmt.run(codigo, id);
}

async function atualizarSenha(db, id, senha) {
  const stmt = db.prepare('UPDATE usuarios SET senha = ?, codigoVerificacao = NULL WHERE id = ?');
  await stmt.run(senha, id);
}

// ==== Funções Admin ====

async function liberarAcesso(db, email) {
  const stmt = db.prepare('UPDATE usuarios SET verificado = ? WHERE email = ?');
  const result = await stmt.run(true, email);
  return result.changes > 0;
}

async function bloquearConta(db, email) {
  const stmt = db.prepare('UPDATE usuarios SET verificado = ? WHERE email = ?');
  const result = await stmt.run(false, email);
  return result.changes > 0;
}

async function atualizarPlano(db, email, plano) {
  const stmt = db.prepare('UPDATE usuarios SET perfil = ? WHERE email = ?');
  const result = await stmt.run(plano, email);
  return result.changes > 0;
}

async function excluir(db, email) {
  const stmt = db.prepare('DELETE FROM usuarios WHERE email = ?');
  const result = await stmt.run(email);
  return result.changes > 0;
}

// (Opcional) Corrige perfis antigos com valor 'usuario'
async function corrigirPerfisAntigos(db) {
  const stmt = db.prepare("UPDATE usuarios SET perfil = 'funcionario' WHERE perfil = 'usuario'");
  return await stmt.run();
}

module.exports = {
  getAll,
  create,
  getByEmail,
  getById,
  marcarVerificado,
  definirCodigo,
  atualizarSenha,
  liberarAcesso,
  bloquearConta,
  atualizarPlano,
  excluir,
  existeNoBanco,
  corrigirPerfisAntigos, // <-- incluído para correção de base antiga
  marcarComoVerificado,
};
