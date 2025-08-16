const express = require('express');
const router = express.Router();

const verificarAdmin = require('../middleware/verificarAdmin');
const Produtor = require('../models/Produtor');
const Fazenda = require('../models/Fazenda');
const Animal = require('../models/animaisModel');
const Usuario = require('../models/Usuario');
const fs = require('fs');
const path = require('path');
const { getDb, initDB } = require('../db');

router.use('/admin', verificarAdmin);

router.get('/admin/dash', (req, res) => {
  res.json({ message: 'Bem-vindo ao painel de administração' });
});

router.get('/admin/produtores', async (req, res) => {
  const produtores = await Produtor.getAll();
  const lista = produtores.map(p => {
    const fazenda = Fazenda.getByProdutor(p.id) || { nome: '', limiteAnimais: 0 };
    const total = Animal.countByProdutor(p.id);
    return {
      id: p.id,
      nome: p.nome,
      email: p.email,
      fazenda: fazenda.nome,
      limiteAnimais: fazenda.limiteAnimais || 0,
      numeroAnimais: total,
      status: p.status || 'ativo',
    };
  });
  res.json(lista);
});

router.patch('/admin/limite/:id', (req, res) => {
  const { limite } = req.body;
  const fazenda = Fazenda.updateLimite(req.params.id, limite);
  res.json(fazenda);
});

router.patch('/admin/status/:id', async (req, res) => {
  const produtor = await Produtor.getById(req.params.id);
  if (!produtor) return res.status(404).json({ error: 'Produtor não encontrado' });
  const novoStatus = produtor.status === 'ativo' ? 'suspenso' : 'ativo';
  await Produtor.updateStatus(req.params.id, novoStatus);
  res.json({ status: novoStatus });
});

router.get('/admin/planos', async (req, res) => {
  function unsanitizeEmail(name) {
    const parts = name.split('_');
    return parts.length > 1 ? parts[0] + '@' + parts.slice(1).join('.') : name;
  }

  const possibles = ['../bancos', '../databases', '../data'];
  let baseDir = possibles.map(p => path.join(__dirname, p)).find(p => fs.existsSync(p));
  if (!baseDir) return res.json([]);

  const lista = [];
  for (const dir of fs.readdirSync(baseDir)) {
    if (dir === 'backups') continue;
    const email = unsanitizeEmail(dir);
    const db = initDB(email);
    const usuarios = db.prepare(`
      SELECT id, nome, email, telefone, plano, planoSolicitado, formaPagamento, status, dataLiberado, dataFimLiberacao
      FROM usuarios WHERE perfil != 'admin'
    `).all();

    usuarios.forEach(u => lista.push({ ...u, banco: `${email}.sqlite` }));
  }

  res.json(lista);
});

router.get('/admin/usuarios', async (req, res) => {
  function unsanitizeEmail(name) {
    const parts = name.split('_');
    return parts.length > 1 ? parts[0] + '@' + parts.slice(1).join('.') : name;
  }

  const possibles = ['../bancos', '../databases', '../data'];
  let baseDir = possibles.map(p => path.join(__dirname, p)).find(p => fs.existsSync(p));
  if (!baseDir) return res.json([]);

  const lista = [];
  for (const dir of fs.readdirSync(baseDir)) {
    if (dir === 'backups') continue;
    const email = unsanitizeEmail(dir);
    const db = initDB(email);
    const usuarios = (await Usuario.getAll(db)).filter(u => u.perfil !== 'admin');

    usuarios.forEach(u => {
      lista.push({
        nome: u.nome,
        email: u.email,
        status: u.verificado ? 'ativo' : 'bloqueado',
        plano: u.perfil,
        nomeFazenda: u.nomeFazenda || '',
        banco: `${email}.sqlite`,
      });
    });
  }

  res.json(lista);
});

router.delete('/admin/usuarios/:id', async (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ message: 'Usuário removido' });
});

// === Novas rotas simplificadas ===
router.patch('/admin/usuario/:id/status', (req, res) => {
  const { status } = req.body;
  const db = getDb();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.prepare('UPDATE usuarios SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status atualizado' });
});

router.patch('/admin/usuario/:id/plano', (req, res) => {
  const { plano, aprovar, formaPagamento } = req.body;
  const db = getDb();
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (aprovar) {
    const inicio = new Date();
    db.prepare(
      'UPDATE usuarios SET plano = ?, planoSolicitado = NULL, formaPagamento = NULL, status = ?, dataLiberado = ? WHERE id = ?'
    ).run(usuario.planoSolicitado, 'ativo', inicio.toISOString(), req.params.id);
    return res.json({ message: 'Plano aprovado' });
  }

  if (plano) {
    db.prepare('UPDATE usuarios SET plano = ?, planoSolicitado = NULL, formaPagamento = ? WHERE id = ?')
      .run(plano, formaPagamento || null, req.params.id);
    return res.json({ message: 'Plano atualizado' });
  }

  res.status(400).json({ error: 'Dados inválidos' });
});

router.patch('/admin/usuario/:id/estender', (req, res) => {
  const { dias } = req.body;
  const db = getDb();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  const inicio = new Date();
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + parseInt(dias || 30, 10));
  db.prepare(
    'UPDATE usuarios SET status = ?, dataLiberado = ?, dataFimLiberacao = ? WHERE id = ?'
  ).run('ativo', inicio.toISOString(), fim.toISOString(), req.params.id);
  res.json({ message: 'Prazo estendido' });
});

router.delete('/admin/usuario/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ message: 'Usuário removido' });
});

router.patch('/admin/liberar/:id', (req, res) => {
  const { dias } = req.body;
  const db = getDb();
  const inicio = new Date();
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + parseInt(dias));
  db.prepare(
    'UPDATE usuarios SET status = ?, dataLiberado = ?, dataFimLiberacao = ? WHERE id = ?'
  ).run('ativo', inicio.toISOString(), fim.toISOString(), req.params.id);
  res.json({ message: 'Usuário liberado temporariamente' });
});

router.patch('/admin/bloquear/:id', (req, res) => {
  const db = getDb();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.prepare('UPDATE usuarios SET status = ? WHERE id = ?').run('suspenso', req.params.id);
  res.json({ status: 'suspenso' });
});

router.patch('/admin/alterar-plano/:id', (req, res) => {
  const { planoSolicitado, formaPagamento } = req.body;
  const db = getDb();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.prepare('UPDATE usuarios SET planoSolicitado = ?, formaPagamento = ? WHERE id = ?')
    .run(planoSolicitado, formaPagamento, req.params.id);
  res.json({ message: 'Solicitação registrada' });
});

router.patch('/admin/definir-plano/:id', (req, res) => {
  const { plano } = req.body;
  if (!plano) return res.status(400).json({ error: 'Plano inválido' });
  const db = getDb();
  db.prepare(`
    UPDATE usuarios SET plano = ?, planoSolicitado = NULL, formaPagamento = NULL WHERE id = ?
  `).run(plano, req.params.id);
  res.json({ message: 'Plano atualizado' });
});

router.patch('/admin/aprovar-pagamento/:id', (req, res) => {
  const db = getDb();
  const usuario = db.prepare('SELECT planoSolicitado FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario || !usuario.planoSolicitado) {
    return res.status(400).json({ error: 'Nenhum plano solicitado' });
  }
  db.prepare(
    'UPDATE usuarios SET plano = ?, planoSolicitado = NULL, formaPagamento = NULL, status = ? WHERE id = ?'
  ).run(usuario.planoSolicitado, 'ativo', req.params.id);
  res.json({ message: 'Plano aprovado' });
});

router.patch('/admin/excluir/:id', (req, res) => {
  const { motivo, confirmacao } = req.body;
  if (!motivo) return res.status(400).json({ error: 'Motivo obrigatório' });
  if (confirmacao !== 'EXCLUIR') {
    return res.status(400).json({ error: 'Confirmação incorreta' });
  }

  const db = getDb();
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

  const pasta = path.join(__dirname, '../dadosExcluidos');
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(
    path.join(pasta, `${req.params.id}.json`),
    JSON.stringify({ ...usuario, motivo, removidoEm: new Date().toISOString() }, null, 2)
  );

  db.prepare('UPDATE usuarios SET status = ? WHERE id = ?').run('inativo', req.params.id);
  res.json({ message: 'Usuário marcado como inativo' });
});

router.get('/admin/pendentes', (req, res) => {
  const db = getDb();
  const pendentes = db
    .prepare('SELECT id, nome, planoSolicitado, formaPagamento FROM usuarios WHERE status = ?')
    .all('pendente');
  res.json(pendentes);
});

router.post('/admin/aprovar-plano', (req, res) => {
  const { idProdutor, plano, dias } = req.body;
  if (!idProdutor || !plano) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  const db = getDb();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(idProdutor);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

  const inicio = new Date();
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + (parseInt(dias, 10) || 30));
  db.prepare(`
    UPDATE usuarios SET plano = ?, planoSolicitado = NULL, formaPagamento = NULL,
    metodoPagamentoId = NULL, status = 'ativo', dataLiberado = ?, dataFimLiberacao = ?
    WHERE id = ?
  `).run(plano, inicio.toISOString(), fim.toISOString(), idProdutor);
  res.json({ message: 'Plano aprovado com sucesso' });
});

router.post('/admin/rejeitar-plano', (req, res) => {
  const { idUsuario } = req.body;
  const db = getDb();
  db.prepare("UPDATE usuarios SET status = 'rejeitado' WHERE id = ?").run(idUsuario);
  res.json({ message: 'Plano rejeitado' });
});

router.post('/admin/metodo-pagamento', (req, res) => {
  const { nome, tipo, identificador } = req.body;
  const db = getDb();
  db.prepare(`
    INSERT INTO metodos_pagamento (nome, tipo, identificador) VALUES (?, ?, ?)
  `).run(nome, tipo, identificador);
  res.json({ message: 'Método de pagamento cadastrado' });
});

router.get('/admin/relatorio-planos', (req, res) => {
  function unsanitizeEmail(name) {
    const parts = name.split('_');
    return parts.length > 1 ? parts[0] + '@' + parts.slice(1).join('.') : name;
  }

  const precosPlano = { basico: 50, intermediario: 80, completo: 120 };
  const quantidadePorPlano = { basico: 0, intermediario: 0, completo: 0, teste: 0 };
  const usuariosPorStatus = { ativo: 0, bloqueado: 0 };
  let pagamentosEsteMes = 0;
  let valorTotalArrecadado = 0;

  const possibles = ['../bancos', '../databases', '../data'];
  let baseDir = possibles.map(p => path.join(__dirname, p)).find(p => fs.existsSync(p));
  if (!baseDir) return res.json({ quantidadePorPlano, usuariosPorStatus, pagamentosEsteMes, valorTotalArrecadado });

  const agora = new Date();
  const dentroMesAtual = data => data && new Date(data).getMonth() === agora.getMonth() && new Date(data).getFullYear() === agora.getFullYear();

  for (const dir of fs.readdirSync(baseDir)) {
    if (dir === 'backups') continue;
    const email = unsanitizeEmail(dir);
    const db = initDB(email);
    const usuarios = db.prepare(`
      SELECT plano, status, dataLiberado, dataFimLiberacao FROM usuarios WHERE perfil != 'admin'
    `).all();

    usuarios.forEach(u => {
      const planoKey = u.plano === 'gratis' ? 'teste' : u.plano;
      if (quantidadePorPlano[planoKey] !== undefined) quantidadePorPlano[planoKey]++;
      if (u.status === 'ativo') usuariosPorStatus.ativo++;
      else if (u.status === 'bloqueado') usuariosPorStatus.bloqueado++;

      if (u.status === 'ativo' && dentroMesAtual(u.dataLiberado) && dentroMesAtual(u.dataFimLiberacao)) {
        pagamentosEsteMes++;
        if (precosPlano[u.plano]) valorTotalArrecadado += precosPlano[u.plano];
      }
    });
  }

  res.json({ quantidadePorPlano, usuariosPorStatus, pagamentosEsteMes, valorTotalArrecadado });
});

module.exports = router;
