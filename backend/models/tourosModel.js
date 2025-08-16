// backend/models/tourosModel.js

/**
 * Retorna todas as fichas de touros do produtor logado.
 * @param {*} db Conexão com o banco (better-sqlite3)
 * @param {*} idProdutor ID do produtor
 * @returns Lista de touros
 */
function getAll(db, idProdutor) {
  return db.prepare('SELECT * FROM touros WHERE idProdutor = ?').all(idProdutor);
}

/**
 * Insere uma nova ficha de touro no banco.
 * @param {*} db Conexão com o banco
 * @param {*} dados Objeto com nome, texto, arquivoBase64 e dataUpload
 * @param {*} idProdutor ID do produtor
 * @returns Objeto inserido com id
 */
function create(db, dados, idProdutor) {
  const stmt = db.prepare(`
    INSERT INTO touros (nome, texto, arquivoBase64, dataUpload, idProdutor)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    dados.nome || '',
    dados.texto || '',
    dados.arquivoBase64 || '',
    dados.dataUpload || new Date().toISOString(),
    idProdutor
  );
  return {
    id: info.lastInsertRowid,
    ...dados,
    idProdutor
  };
}

module.exports = {
  getAll,
  create,
};

