import verificarAlertaEstoque from './verificarAlertaEstoque';
import { eventosDeHoje } from '../pages/AppTarefas/utilsDashboard';
import { criarAvisoEstoqueFaltando, movimentarImplanteEstoque } from '../pages/Reproducao/utilsReproducao';
import { temEstoquePara } from './estoque';

function parseData(data) {
  if (!data) return null;
  if (data.includes('-')) return new Date(data);
  const [d, m, y] = data.split('/');
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

import api from '../api';
import { buscarTodosAnimais } from '../api';

export async function gerarTarefasDoDia(dataHoje) {
  const animais = await buscarTodosAnimais();
  const mapa = new Map();

  animais.forEach((animal) => {
    if (animal.protocoloAtivo && animal.protocoloAtivo.status === 'ativo') {
      (animal.protocoloAtivo.etapasProgramadas || []).forEach((etapa) => {
        if (etapa.data === dataHoje && etapa.status === 'pendente') {
          const chave = `${animal.numero}-${etapa.subtipo || etapa.acao}-${dataHoje}`;
          if (!mapa.has(chave)) {
            mapa.set(chave, {
              tipo: etapa.acao,
              subtipo: etapa.subtipo,
              animalNumero: animal.numero,
              nome: animal.nome || '',
              implanteUso: etapa.implanteUso,
              movimentado: etapa.movimentado,
            });
          }
        }
      });
    }
  });

  return Array.from(mapa.values());
}

export function verificarEstoqueParaEtapas(etapas) {
  const faltando = new Set();

  etapas.forEach((etapa) => {
    if (!etapa.subtipo) return;
    const quantidade = parseFloat(etapa.quantidade || 1);

    if (!temEstoquePara(etapa.subtipo, quantidade)) {
      faltando.add(etapa.subtipo);
    }
  });

  return Array.from(faltando);
}

function padronizarDescricao(acao = '', subtipo = '', numero = '') {
  const a = (acao || '').toLowerCase();
  if (a.includes('inserir dispositivo')) return `Inserir Dispositivo na Vaca ${numero}`;
  if (a.includes('retirar dispositivo')) return `Retirar Dispositivo da Vaca ${numero}`;
  if (a.includes('insemin')) return `Inseminar Vaca ${numero}`;
  const prefix = a.startsWith('aplicar') ? acao : `Aplicar ${acao}`;
  const complemento = subtipo ? ` — ${subtipo}` : '';
  return `${prefix}${complemento} na Vaca ${numero}`;
}

export default async function gerarTarefasAutomaticas() {
  const hojeISO = new Date().toISOString().slice(0, 10);
  const hoje = new Date(hojeISO);

  // 📚 Histórico de tarefas concluídas para evitar recriação
  const historico = await buscarTodos('historicoTarefas');
  const concluidas = new Set(historico.map((h) => h.id));
  const chavesConcluidas = new Set(
    historico
      .filter((h) => h.subtipo && h.numeroAnimal)
      .map((h) => `${h.dataConclusao}-${h.subtipo}-${h.numeroAnimal}`)
  );

  // 🧹 Limpa tarefas automáticas antigas e mantém apenas as manuais
  let tarefas = await buscarTodos('tarefasGeradas');
  tarefas = tarefas.filter((t) => t.tipo === 'manual');

  // 🔑 Armazena combinações exclusivas de tarefas (data+subtipo+animal)
  const chavesExistentes = new Set();
  tarefas.forEach((t) => {
    const numero = t.numero || t.animalNumero || '';
    if (t.subtipo && numero) {
      const chave = `${t.data}-${t.subtipo}-${numero}`;
      chavesExistentes.add(chave);
    }
  });
  // Inclui chaves de tarefas já concluídas
  chavesConcluidas.forEach((c) => chavesExistentes.add(c));
  const alertasGerados = new Set();

  const adicionar = (id, descricao, tipo, extra = {}) => {
    const numero = extra.numero || extra.animalNumero || extra.vaca || '';
    const chave = extra.subtipo && numero ? `${hojeISO}-${extra.subtipo}-${numero}` : null;
    if (concluidas.has(id) || (chave && chavesConcluidas.has(chave))) return;
    if (chave && chavesExistentes.has(chave)) return;
    if (!tarefas.some((t) => t.id === id)) {
      tarefas.push({ id, data: hojeISO, descricao, tipo, status: 'pendente', ...extra });
      if (chave) chavesExistentes.add(chave);
    }
  };

  // ➕ Tarefas de tratamento
  const tratamentos = await buscarTodos('tratamentos');
  tratamentos.forEach((tr, idx) => {
    const inicio = parseData(tr.dataInicio || tr.data);
    if (!inicio) return;
    const dur = parseInt(tr.duracao) || 1;
    for (let i = 0; i < dur; i++) {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      if (d.toDateString() === hoje.toDateString()) {
        const id = `trat-${idx}-${i}-${hojeISO}`;
        adicionar(id, `Aplicar ${tr.produto} na Vaca ${tr.numeroAnimal}`, 'tratamento');
      }
    }
  });

  // ➕ Alertas de carência
  const carencias = await buscarTodos('alertasCarencia');
  carencias.forEach((c, idx) => {
    const leite = parseData(c.leiteAte);
    const carne = parseData(c.carneAte);
    if (leite && leite >= hoje) {
      adicionar(`car-leite-${c.numeroAnimal}-${idx}`, `Carência da Vaca ${c.numeroAnimal} até ${c.leiteAte} (leite)`, 'carencia');
    }
    if (carne && carne >= hoje) {
      adicionar(`car-carne-${c.numeroAnimal}-${idx}`, `Carência da Vaca ${c.numeroAnimal} até ${c.carneAte} (carne)`, 'carencia');
    }
  });

  // ➕ Validade dos produtos
  const produtos = await buscarTodos('estoque');
  const listaProdutos = Array.isArray(produtos) ? produtos : [];
  const diasAlerta = 10;

  async function verificarValidades(produto) {
    if (!produto.validade) return;
    const dv = parseData(produto.validade);
    if (!dv) return;
    const diff = Math.ceil((dv - hoje) / (1000 * 60 * 60 * 24));
    const chaveLida = `validade_lida_${produto.nomeComercial}_${hojeISO}`;
    const lidas = await buscarTodos('validadeLida');
    if (lidas.some((l) => l.id === chaveLida)) return;
    if (diff < 0) {
      adicionar(
        `venc_prod_${produto.nomeComercial}`,
        `Produto ${produto.nomeComercial} está vencido desde ${produto.validade}. Ação imediata recomendada.`,
        'validade',
        { produto: produto.nomeComercial }
      );
    } else if (diff <= diasAlerta) {
      adicionar(
        `venc_prod_${produto.nomeComercial}`,
        `Produto ${produto.nomeComercial} vence em ${produto.validade}. Verificar uso ou substituição.`,
        'validade',
        { produto: produto.nomeComercial }
      );
    }
  }

  for (const p of listaProdutos) {
    await verificarValidades(p);
  }

  // ➕ Eventos do dia (protocolos, partos etc.)
  const eventos = await eventosDeHoje();
  eventos.forEach((ev) => {
    if (ev.tipo === 'protocolo') return; // etapas já tratadas abaixo
    const chave = [ev.tipo, ev.vaca, ev.title, ev.date || hojeISO]
      .filter(Boolean)
      .join('-')
      .replace(/\s+/g, '_');
    const id = `evento-${chave}`;
    adicionar(id, ev.title, 'evento');
  });

  // ➕ Etapas de protocolos
  // 🛡️ Garante que só gera tarefas de protocolo se o animal tem protocolo ativo
  const animais = await buscarTodosAnimais();
  const numerosComProtocolo = animais
    .filter((a) => a.protocoloAtivo && a.protocoloAtivo.status === 'ativo')
    .map((a) => String(a.numero));

  const etapasHoje = (await gerarTarefasDoDia(hojeISO)).filter((e) =>
    numerosComProtocolo.includes(String(e.animalNumero))
  );

  for (const etapa of etapasHoje) {
    const idBase = `${etapa.animalNumero}-${etapa.subtipo || etapa.tipo}`
      .replace(/\s+/g, '_');
    const chave = `prot-${idBase}-${hojeISO}`;
    const quantidadeNec = parseFloat(etapa.quantidade || 1);
    adicionar(
      chave,
      padronizarDescricao(etapa.tipo, etapa.subtipo, etapa.animalNumero),
      'protocolo',
      {
        origem: 'protocolo',
        numero: etapa.animalNumero,
        subtipo: etapa.subtipo,
        quantidade: quantidadeNec,
      }
    );

    if ((etapa.tipo || '').toLowerCase().includes('inserir dispositivo')) {
      const disp = (await buscarTodos('implantes')).filter(
        (i) => String(i.uso) === String(etapa.implanteUso) && !i.emUsoPor
      ).length;
      if (disp < 1) {
        const alertaId = `faltando-dispositivo-${etapa.implanteUso}-${hojeISO}`;
        if (!tarefas.some((t) => t.id === alertaId)) {
          tarefas.push({
            id: alertaId,
            data: hojeISO,
            descricao: `Dispositivo de ${etapa.implanteUso}º uso indisponível no estoque.`,
            tipo: 'estoque',
            status: 'pendente',
          });
          const avisos = await buscarTodos('avisos');
          await adicionarItem('avisos', [
            ...avisos,
            {
              msg: `Dispositivo de ${etapa.implanteUso}º uso indisponível no estoque.`,
              data: new Date().toISOString(),
            },
          ]);
          }
      }
    } else if (!temEstoquePara(etapa.subtipo, quantidadeNec)) {
      if (etapa.subtipo) {
        const alertaId = `faltando-${etapa.subtipo}-${hojeISO}`;
        if (!alertasGerados.has(alertaId)) {
          adicionar(
            alertaId,
            `Estoque insuficiente para aplicação de ${etapa.subtipo}.`,
            'estoque'
          );
          criarAvisoEstoqueFaltando({
            principioAtivo: etapa.subtipo,
            vaca: etapa.animalNumero,
            protocoloId: null,
            quantidadeNecessaria: quantidadeNec,
          });
          alertasGerados.add(alertaId);
        }
      }
    }

    if ((etapa.tipo || '').toLowerCase().includes('retirar dispositivo') && etapa.implanteUso && !etapa.movimentado) {
      movimentarImplanteEstoque(etapa.implanteUso, etapa.animalNumero);
      const animais = await buscarTodosAnimais();
      const idxA = animais.findIndex(a => a.numero === etapa.animalNumero);
      if (idxA !== -1) {
        const etapas = animais[idxA].protocoloAtivo?.etapasProgramadas || [];
        const etIdx = etapas.findIndex(e => e.data === hojeISO && e.acao === etapa.tipo);
        if (etIdx !== -1) {
          etapas[etIdx].movimentado = true;
          animais[idxA].protocoloAtivo.etapasProgramadas = etapas;
          await adicionarItem('animais', animais);
        }
      }
    }
  }



  // 🔄 Remove tarefas duplicadas e salva
  const mapaFinal = new Map();
  tarefas.forEach((t) => {
    const num = t.numero || t.animalNumero || '';
    const chave = `${t.descricao}-${num}-${t.subtipo || ''}-${t.data}`;
    if (!mapaFinal.has(chave)) mapaFinal.set(chave, t);
  });
  tarefas = Array.from(mapaFinal.values());
  const existentes = await buscarTodos('tarefasGeradas');
  for (const t of existentes) await excluirItem('tarefasGeradas', t.id);
  for (const t of tarefas) await adicionarItem('tarefasGeradas', t);
  window.dispatchEvent(new Event('tarefasAtualizadas'));
  window.dispatchEvent(new Event('eventosCalendarioAtualizados'));
}
