const express = require('express');
const router = express.Router();
const { initDB } = require('../db');
const autenticarToken = require('../middleware/autenticarToken');

router.use(autenticarToken);

router.patch('/solicitar-plano', (req, res) => {
  const { planoSolicitado, formaPagamento } = req.body;

  if (!planoSolicitado || !formaPagamento) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const planosValidos = ['basico', 'intermediario', 'completo'];
  const formasValidas = ['pix', 'cartao', 'dinheiro'];

  if (!planosValidos.includes(planoSolicitado) || !formasValidas.includes(formaPagamento)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const db = initDB(req.user.email);
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.user.idProdutor);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  db.prepare('UPDATE usuarios SET planoSolicitado = ?, formaPagamento = ?, status = ? WHERE id = ?')
    .run(planoSolicitado, formaPagamento, 'pendente', req.user.idProdutor);

  res.json({ message: 'Plano solicitado com sucesso' });
});

// Retorna informacoes do plano atual do usuario
router.get('/plano-status', (req, res) => {
  const db = initDB(req.user.email);
  const dados = db
    .prepare(
      `SELECT plano, planoSolicitado, formaPagamento, status, dataLiberado, dataFimLiberacao
       FROM usuarios WHERE id = ?`
    )
    .get(req.user.idProdutor);

  if (!dados) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  res.json(dados);
});

module.exports = router;
