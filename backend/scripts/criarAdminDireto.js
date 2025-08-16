const bcrypt = require('bcryptjs');
const { initDB } = require('../db');

// Abre o banco do admin
const db = initDB('fernando@gestaoleiteira.com');

const senhaCriptografada = bcrypt.hashSync('123456', 10);

db.prepare(`
  INSERT INTO usuarios (
    nome,
    nomeFazenda,
    email,
    telefone,
    senha,
    verificado,
    codigoVerificacao,
    perfil
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Fernando',
  'Fazenda Principal',
  'fernando@gestaoleiteira.com',
  '999999999',
  senhaCriptografada,
  1,
  null,
  'admin'
);

console.log('Admin criado no banco correto!');
