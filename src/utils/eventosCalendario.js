import { db } from './db';

// Cria a estrutura da tabela apenas quando o método serialize existir
const criarTabela = () => {
  db.run(`CREATE TABLE IF NOT EXISTS eventosCalendario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      titulo TEXT,
      descricao TEXT,
      tipo TEXT,
      numeroAnimal TEXT
    )`);
};

if (typeof db.serialize === 'function') {
  db.serialize(criarTabela);
} else {
  criarTabela();
}

export async function addEventoCalendario(evento) {
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO eventosCalendario (data, titulo, descricao, tipo, numeroAnimal) VALUES (?, ?, ?, ?, ?)`,
      [
        evento.data,
        evento.titulo || '',
        evento.descricao || '',
        evento.tipo || '',
        evento.numeroAnimal || null,
      ],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  window.dispatchEvent(new Event('eventosExtrasAtualizados'));
}

export async function salvarEventoNoCalendario(evento) {
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO eventosCalendario (data, titulo, descricao, tipo, numeroAnimal) VALUES (?, ?, ?, ?, ?)`,
      [
        evento.data,
        evento.titulo || '',
        evento.descricao || '',
        evento.tipo || '',
        evento.numeroAnimal || null,
      ],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  window.dispatchEvent(new Event('eventosCalendarioAtualizados'));
}
