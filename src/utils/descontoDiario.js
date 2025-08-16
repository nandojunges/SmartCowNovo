// Função para executar descontos diários de estoque com base em dietas e ciclos de limpeza

import verificarAlertaEstoque from './verificarAlertaEstoque';
import { adicionarMovimentacao } from './financeiro';
import { db, buscarTodos, adicionarItem, atualizarItem } from './backendApi';

function converterQuantidade(valor, unidadeOrigem, unidadeBase) {
  let q = parseFloat(valor) || 0;
  if (!unidadeOrigem || !unidadeBase) return q;
  const orig = unidadeOrigem.toLowerCase();
  const base = unidadeBase.toLowerCase();

  if (base.startsWith('l')) {
    if (orig === 'ml') return q / 1000;
    if (orig.startsWith('l')) return q;
  }
  if (base === 'ml') {
    if (orig.startsWith('l')) return q * 1000;
    if (orig === 'ml') return q;
  }
  if (base === 'kg') {
    if (orig === 'g') return q / 1000;
    if (orig === 'kg') return q;
  }
  if (base === 'g') {
    if (orig === 'kg') return q * 1000;
    if (orig === 'g') return q;
  }
  return q;
}

function parseCond(c) {
  if (!c) return { tipo: 'sempre' };
  if (typeof c === 'object') return c;
  if (c === 'sempre') return { tipo: 'sempre' };
  const m = c.match(/a cada\s*(\d+)/i);
  if (m) return { tipo: 'cada', intervalo: parseInt(m[1]) };
  if (c.toLowerCase().includes('manhã')) return { tipo: 'manha' };
  if (c.toLowerCase().includes('tarde')) return { tipo: 'tarde' };
  return { tipo: 'sempre' };
}

function vezesPorDia(cond, freq) {
  switch (cond.tipo) {
    case 'cada':
      return freq / (cond.intervalo || 1);
    case 'manha':
    case 'tarde':
      return 1;
    default:
      return freq;
  }
}

export default async function executarDescontoDiario() {
  // Função desativada na versão sem Firebase
  return;
}
