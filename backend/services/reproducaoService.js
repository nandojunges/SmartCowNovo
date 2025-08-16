const Tarefas = require('../models/tarefasModel');
const Estoque = require('../models/estoqueModel');
const Animais = require('../models/animaisModel');
/**
 * Serviço responsável por acionar outras funcionalidades (tarefas, estoque, etc.)
 * quando uma inseminação ou diagnóstico reprodutivo é registrado.
 * Exemplo: agenda uma tarefa de checagem futura e deduz itens do estoque.
 */
async function handleReproducao(db, dados, idProdutor) {
  // Agenda uma tarefa de checar gestação 30 dias após a data informada
  if (dados.data) {
    const checkDate = new Date(dados.data);
    checkDate.setDate(checkDate.getDate() + 30);
    await Tarefas.create(
      db,
      {
        descricao: `Checar gestação do animal ${dados.numero}`,
        data: checkDate.toISOString().slice(0, 10),
        concluida: false,
      },
      idProdutor,
    );
  }
  // Deduz do estoque os itens utilizados no protocolo (se fornecidos)
  if (Array.isArray(dados.itensUsados)) {
    for (const itemUso of dados.itensUsados) {
      const current = Estoque.getById(db, itemUso.idItem, idProdutor);
      if (current) {
        const novaQtd = current.quantidade - itemUso.quantidade;
        Estoque.update(
          db,
          current.id,
          {
            item: current.item,
            quantidade: novaQtd < 0 ? 0 : novaQtd,
            unidade: current.unidade,
          },
          idProdutor,
        );
      }
    }
  }

  // Se número do animal e data da IA forem fornecidos, agenda as tarefas de secagem e pré‑parto
  if (dados.numero && dados.data) {
    await schedulePrenatalTasks(db, dados.numero, dados.data, idProdutor);
  }
}

/**
 * Agenda tarefas para secagem, pré‑parto e parto com base na data da inseminação.
 * - Calcula a data prevista de parto (~283 dias de gestação).
 * - Agenda secagem 60 dias antes, pré‑parto 14 dias antes e a preparação para parto 7 dias antes.
 * - Atualiza a propriedade previsaoParto do animal, se existir, para facilitar consultas.
 */
async function schedulePrenatalTasks(db, numeroAnimal, dataIA, idProdutor) {
  try {
    const iaDate = new Date(dataIA);
    // 283 dias de gestação para bovinos leiteiros
    const dueDate = new Date(iaDate);
    dueDate.setDate(dueDate.getDate() + 283);

    // Secagem 60 dias antes do parto
    const dryingDate = new Date(dueDate);
    dryingDate.setDate(dryingDate.getDate() - 60);
    await Tarefas.create(
      db,
      {
        descricao: `Secar vaca ${numeroAnimal}`,
        data: dryingDate.toISOString().slice(0, 10),
        concluida: false,
      },
      idProdutor,
    );

    // Pré‑parto 14 dias antes do parto
    const prePartoDate = new Date(dueDate);
    prePartoDate.setDate(prePartoDate.getDate() - 14);
    await Tarefas.create(
      db,
      {
        descricao: `Pré‑parto da vaca ${numeroAnimal}`,
        data: prePartoDate.toISOString().slice(0, 10),
        concluida: false,
      },
      idProdutor,
    );

    // Preparação para parto 7 dias antes do parto
    const partoPrepDate = new Date(dueDate);
    partoPrepDate.setDate(partoPrepDate.getDate() - 7);
    await Tarefas.create(
      db,
      {
        descricao: `Próximo parto da vaca ${numeroAnimal}`,
        data: partoPrepDate.toISOString().slice(0, 10),
        concluida: false,
      },
      idProdutor,
    );

    // Atualiza a previsão de parto no cadastro do animal
    const animal = await Animais.getByNumero(db, numeroAnimal, idProdutor);
    if (animal) {
      await Animais.update(
        db,
        animal.id,
        {
          ...animal,
          previsaoParto: dueDate.toISOString().slice(0, 10),
        },
        idProdutor,
      );
    }
  } catch (err) {
    // Em caso de erro, registra no console sem interromper o fluxo
    console.error('Erro ao agendar tarefas de pré‑parto:', err);
  }
}

module.exports = { handleReproducao };

