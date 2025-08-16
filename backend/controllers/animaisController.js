const { initDB } = require('../db');
const Animais = require('../models/animaisModel');
const Eventos = require('../models/eventosModel');
const padronizarDadosAnimal = require('../utils/padronizarDadosAnimal');

// Novo endpoint simples para listar animais utilizando uma consulta
// que continua funcionando mesmo que a tabela ficha_complementar nao exista.
function getAnimais(req, res) {
  const db = initDB(req.user.email);
  try {
    const tabelaExiste = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ficha_complementar'"
      )
      .get();

    const query = tabelaExiste
      ? `\n      SELECT \n        a.id, a.numero, a.nascimento, a.origem, a.categoria,\n        f.numero_partos, f.ultimo_parto, f.ultima_inseminacao,\n        DATE('now') AS hoje,\n        CASE\n          WHEN f.ultimo_parto IS NOT NULL THEN julianday('now') - julianday(f.ultimo_parto)\n          ELSE NULL\n        END AS del\n      FROM animais a\n      LEFT JOIN ficha_complementar f ON a.id = f.animal_id\n    `
      : `\n      SELECT\n        a.id, a.numero, a.nascimento, a.origem, a.categoria,\n        NULL AS numero_partos, NULL AS ultimo_parto, NULL AS ultima_inseminacao,\n        DATE('now') AS hoje, NULL AS del\n      FROM animais a`;

    const rows = db.prepare(query).all();
    const animais = rows
      .map((r) => {
        try {
          return padronizarDadosAnimal(r);
        } catch (err) {
          console.error('Erro ao padronizar animal:', err.message);
          return null;
        }
      })
      .filter(Boolean);
    res.json(animais);
  } catch (error) {
    console.error('Erro ao buscar animais:', error.message);
    res.status(500).json({ error: 'Erro ao buscar animais' });
  }
}

function calcularDELParaAnimal(db, animal_id, idProdutor) {
  const eventos = Eventos.getByAnimal(db, animal_id, idProdutor) || [];
  let ultimoParto = null;
  for (const ev of eventos) {
    if (ev.tipoEvento === 'Parto') {
      if (!ultimoParto || new Date(ev.dataEvento) > new Date(ultimoParto.dataEvento)) {
        ultimoParto = ev;
      }
    }
  }
  if (!ultimoParto) return null;
  const dataParto = new Date(ultimoParto.dataEvento);
  const secagemPosterior = eventos.find(
    (e) => e.tipoEvento === 'Secagem' && new Date(e.dataEvento) > dataParto,
  );
  if (secagemPosterior) return 0;
  const diff = Math.floor((Date.now() - dataParto.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

// Listar todos os animais do usuário logado
async function listarAnimais(req, res) {
  const db = initDB(req.user.email);

  try {
    console.log('🧩 Buscando animais');
    const animaisBrutos = await Animais.getAll(db, req.user.idProdutor);
    const animaisPadronizados = animaisBrutos
      .map((animal) => {
        try {
          return padronizarDadosAnimal(animal);
        } catch (e) {
          console.error('❌ Erro ao padronizar animal:', animal, e.message);
          return null;
        }
      })
      .filter((a) => a !== null);

    for (const a of animaisPadronizados) {
      if (a.id) {
        const del = calcularDELParaAnimal(db, a.id, req.user.idProdutor);
        if (del !== null) {
          await Animais.setDEL(db, a.id, del, req.user.idProdutor);
          a.del = del;
        }
      }
      // Garantir valores válidos mesmo para registros antigos
      padronizarDadosAnimal(a);
    }
    console.log('✅ Resultado:', animaisPadronizados);
    res.json(animaisPadronizados);
  } catch (error) {
    console.error('❌ Erro geral ao listar animais:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar animais' });
  }
}

// Buscar animal por ID
async function buscarAnimalPorId(req, res) {
  const db = initDB(req.user.email);
  const id = req.params.id;

  try {
    const bruto = await Animais.getById(db, parseInt(id), req.user.idProdutor);
    const animal = padronizarDadosAnimal(bruto);
    if (!animal) return res.status(404).json({ message: 'Animal não encontrado' });
    const del = calcularDELParaAnimal(db, animal.id, req.user.idProdutor);
    if (del !== null) {
      await Animais.setDEL(db, animal.id, del, req.user.idProdutor);
      animal.del = del;
    }
    res.json(animal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar animal' });
  }
}

// Cadastrar novo animal
async function cadastrarAnimal(req, res) {
  const db = initDB(req.user.email);
  const novoAnimal = { ...req.body, idProdutor: req.user.idProdutor };

  try {
    const criadoBruto = await Animais.create(db, novoAnimal, req.user.idProdutor);
    const animalCriado = (() => {
      try {
        return padronizarDadosAnimal(criadoBruto);
      } catch (e) {
        console.error('Erro ao padronizar animal:', e.message);
        return criadoBruto;
      }
    })();
    if (req.body.ultimoParto) {
      Eventos.create(
        db,
        {
          animal_id: animalCriado.id,
          dataEvento: req.body.ultimoParto,
          tipoEvento: 'Parto',
          descricao: 'Ficha complementar',
        },
        req.user.idProdutor,
      );
      await Animais.setDEL(
        db,
        animalCriado.id,
        calcularDELParaAnimal(db, animalCriado.id, req.user.idProdutor),
        req.user.idProdutor,
      );
    }
    if (req.body.ultimaIA) {
      Eventos.create(
        db,
        {
          animal_id: animalCriado.id,
          dataEvento: req.body.ultimaIA,
          tipoEvento: 'IA',
          descricao: 'Ficha complementar',
        },
        req.user.idProdutor,
      );
    }
    res.status(201).json(animalCriado);
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error);
    res.status(500).json({ message: 'Erro ao cadastrar animal', erro: error.message });
  }
}

// Editar animal existente
async function editarAnimal(req, res) {
  const db = initDB(req.user.email);
  const id = req.params.id;
  const dadosAtualizados = {
    ...req.body,
    // Se nenhum status for enviado, mantém o animal ativo (1)
    status: req.body.status ?? 1,
    motivoSaida: req.body.motivoSaida ?? null,
    dataSaida: req.body.dataSaida ?? null,
    valorVenda: req.body.valorVenda ?? null,
    observacoesSaida: req.body.observacoesSaida ?? null,
    // garante que o tipo de saída seja enviado à camada de modelo
    tipoSaida: req.body.tipoSaida ?? null,
  };

  try {
    const atualizadoBruto = await Animais.update(db, id, dadosAtualizados, req.user.idProdutor);
    const animalAtualizado = (() => {
      try {
        return padronizarDadosAnimal(atualizadoBruto);
      } catch (e) {
        console.error('Erro ao padronizar animal:', e.message);
        return atualizadoBruto;
      }
    })();
    if (req.body.ultimoParto) {
      Eventos.create(
        db,
        {
          animal_id: id,
          dataEvento: req.body.ultimoParto,
          tipoEvento: 'Parto',
          descricao: 'Ficha complementar',
        },
        req.user.idProdutor,
      );
      await Animais.setDEL(db, id, calcularDELParaAnimal(db, id, req.user.idProdutor), req.user.idProdutor);
    }
    if (req.body.ultimaIA) {
      Eventos.create(
        db,
        {
          animal_id: id,
          dataEvento: req.body.ultimaIA,
          tipoEvento: 'IA',
          descricao: 'Ficha complementar',
        },
        req.user.idProdutor,
      );
    }
    res.status(200).json(animalAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao editar animal' });
  }
}

// Remover animal
async function excluirAnimal(req, res) {
  const db = initDB(req.user.email);
  const id = req.params.id;

  try {
    await Animais.remove(db, id, req.user.idProdutor);
    res.json({ message: 'Animal removido com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir animal' });
  }
}

// Aplica secagem ao animal e registra evento
async function aplicarSecagem(req, res) {
  const db = initDB(req.user.email);
  const { id } = req.params;
  const { dataSecagem, plano } = req.body;
  try {
    Eventos.create(
      db,
      {
        animal_id: id,
        dataEvento: dataSecagem,
        tipoEvento: 'Secagem',
        descricao: plano || '',
      },
      req.user.idProdutor
    );
    await Animais.setDEL(db, id, 0, req.user.idProdutor);
    await Animais.updateStatus(db, id, 2, req.user.idProdutor);
    res.status(200).json({ message: 'Secagem aplicada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao aplicar secagem' });
  }
}

// Registra parto, cria bezerra e atualiza dados
async function registrarParto(req, res) {
  const db = initDB(req.user.email);
  const { id } = req.params;
  const { dataParto, sexoBezerro } = req.body;
  try {
    await Animais.incrementarLactacoes(db, id, req.user.idProdutor);
    await Animais.updateStatus(db, id, 1, req.user.idProdutor);
    const novaBezerra = await Animais.createBezerra(
      db,
      {
        nascimento: dataParto,
        sexo: sexoBezerro,
        mae: id,
      },
      req.user.idProdutor
    );
    Eventos.create(
      db,
      {
        animal_id: id,
        dataEvento: dataParto,
        tipoEvento: 'Parto',
        descricao: `Bezerra ${novaBezerra.numero}`,
      },
      req.user.idProdutor
    );
    await Animais.setDEL(db, id, 0, req.user.idProdutor);
    res.status(201).json({ message: 'Parto registrado', bezerra: novaBezerra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar parto' });
  }
}

module.exports = {
  listarAnimais,
  buscarAnimalPorId,
  cadastrarAnimal,
  adicionarAnimal: cadastrarAnimal,
  editarAnimal,
  excluirAnimal,
  aplicarSecagem,
  registrarParto,
  getAnimais,
};