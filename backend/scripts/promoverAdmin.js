const { initDB } = require('../db');

const db = initDB('fernando@gestaoleiteira.com');

db.prepare(`
  UPDATE usuarios SET perfil = 'admin' WHERE email = ?
`).run('fernando@gestaoleiteira.com');

console.log('Usuário promovido a admin!');
