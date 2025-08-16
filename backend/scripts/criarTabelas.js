const Database = require('better-sqlite3');

// Abra o banco
const db = new Database('./gestao_leiteira.db');

// Crie a tabela usuarios
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    nomeFazenda TEXT,
    email TEXT UNIQUE,
    telefone TEXT,
    senha TEXT,
    verificado INTEGER DEFAULT 0,
    codigoVerificacao TEXT,
    perfil TEXT DEFAULT 'usuario'
  );
`);

console.log('Tabela usuarios criada com sucesso!');
