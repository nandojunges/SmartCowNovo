import {
  db,
  adicionarItem,
  atualizarItem,
  excluirItem,
  buscarPorId,
  buscarTodos,
} from './backendApi';

const COL = 'custos';

export async function carregarCustos() {
  try {
    const dados = await buscarTodos(COL);
    return dados || [];
  } catch {
    return [];
  }
}

export async function adicionarCusto(item) {
  await adicionarItem(COL, item);
  window.dispatchEvent(new Event('tabelaCustosAtualizada'));
}

export async function atualizarCusto(id, dados) {
  await atualizarItem(COL, { id: String(id), ...dados });
  window.dispatchEvent(new Event('tabelaCustosAtualizada'));
}

export async function removerCusto(id) {
  await excluirItem(COL, String(id));
  window.dispatchEvent(new Event('tabelaCustosAtualizada'));
}

export async function obterPrecoProduto(nome) {
  if(!nome) return 0;
  const lista = await carregarCustos();
  const item = lista.find(i => (i.nome || '').toLowerCase() === nome.toLowerCase());
  return item ? parseFloat(item.precoUnitario || 0) : 0;
}

async function registrarUso(nome) {
  if(!nome) return;
  const existente = await buscarPorId('custosPendentes', nome);
  if(!existente) {
    await adicionarItem('custosPendentes', { id: nome, nome });
    window.dispatchEvent(new Event('custosPendentesAtualizados'));
  }
}

export async function calcularCustoTotal(nome, quantidade) {
  const preco = await obterPrecoProduto(nome);
  const qt = parseFloat(quantidade || 0);
  if(preco <= 0) await registrarUso(nome);
  return preco > 0 && qt > 0 ? preco * qt : 0;
}

export async function carregarCustosPadrao() {
  const dados = await buscarPorId('parametrosFinanceiros', 'custosFixos');
  return dados || {};
}

