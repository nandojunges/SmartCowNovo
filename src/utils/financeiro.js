import {
  adicionarLancamentoFinanceiro,
  buscarFinanceiro,
  buscarLancamentosPorPeriodo,
  deletarLancamento,
  editarLancamento,
} from '../utils/apiFuncoes.js';

const COL = 'financeiro';

export async function carregarMovimentacoes() {
  return carregarFinanceiroPorPeriodo();
}

export async function registrarMovimentoFinanceiro(dados) {
  await adicionarLancamentoFinanceiro(dados);
}

export async function carregarFinanceiroPorPeriodo(inicio, fim) {
  try {
    const lista = await buscarLancamentosPorPeriodo(inicio, fim);
    const adaptados = [];
    (lista || []).forEach((mItem) => {
      const m = { ...mItem };
      const id = m.id;
      try {
        const data = new Date(m.data);
        if (isNaN(data)) return;
        let { categoria = '', subcategoria = '', origem = '' } = m;
        const desc = String(m.descricao || '');
        if (!origem && m.tipo === 'Saída' && /entrada de/i.test(desc)) {
          origem = 'estoque';
        }
        if (!categoria && /(sanitrex|catol)/i.test(desc)) {
          categoria = 'Higiene';
        }
        const valor =
          parseFloat(String(m.valor).replace(/\./g, '').replace(',', '.')) || 0;
        adaptados.push({
          id,
          ...m,
          data: data.toISOString().slice(0, 10),
          categoria,
          subcategoria: subcategoria || '',
          origem: origem || '',
          centroCusto: m.centroCusto || '',
          valor,
        });
      } catch {
        // ignora registros inválidos
      }
    });
    return adaptados.sort((a, b) => b.data.localeCompare(a.data));
  } catch {
    return [];
  }
}

export async function excluirMovimentoFinanceiro(id) {
  if (!id) return;
  await deletarLancamento(id);
}

function classificarMovimento(origem = '') {
  const padrao = origem.toLowerCase();
  if (padrao.includes('catol'))
    return { categoria: 'Higiene', subcategoria: 'Sanitizante' };
  if (padrao.includes('sanitrex'))
    return { categoria: 'Higiene', subcategoria: 'Sanitizante' };
  if (padrao.includes('benzoato'))
    return { categoria: 'Medicamento', subcategoria: 'Hormônio reprodutivo' };
  return { categoria: '', subcategoria: '' };
}

export async function adicionarMovimentacao(mov) {
  let { categoria, subcategoria, origem, numeroAnimal, centroCusto = '' } = mov;
  if ((!categoria || !subcategoria) && mov.origem) {
    const res = classificarMovimento(mov.origem);
    categoria = categoria || res.categoria;
    subcategoria = subcategoria || res.subcategoria;
  }
  origem = origem || 'Manual';
  const valor =
    parseFloat(String(mov.valor).replace(/\./g, '').replace(',', '.')) || 0;
  await registrarMovimentoFinanceiro({
    ...mov,
    valor,
    categoria,
    subcategoria,
    origem,
    numeroAnimal,
    centroCusto,
  });
}

export async function removerMovimentacao(id) {
  await excluirMovimentoFinanceiro(id);
}

export async function atualizarMovimentacao(id, dados) {
  const valor =
    parseFloat(String(dados.valor).replace(/\./g, '').replace(',', '.')) || 0;
  await editarLancamento(id, { ...dados, valor });
}
