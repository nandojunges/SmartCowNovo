import { db, buscarTodos, adicionarItem, atualizarItem, excluirItem } from './backendApi';

export async function temEstoquePara(principioAtivo, quantidade = 1) {
  if (!principioAtivo) return false;
  const produtos = await buscarTodos('estoque');
  const alvo = String(principioAtivo).toLowerCase();
  const total = produtos.reduce((soma, p) => {
    const principios = String(p.principioAtivo || '')
      .toLowerCase()
      .split(',');
    if (principios.some((pr) => pr.trim() === alvo)) {
      const q = parseFloat(p.quantidade || 0);
      return soma + (isNaN(q) ? 0 : q);
    }
    return soma;
  }, 0);
  return total >= parseFloat(quantidade || 1);
}

export const temEstoqueSuficiente = temEstoquePara;

export async function carregarEstoqueFirestore() {
  return buscarTodos('estoque');
}

export async function adicionarProdutoEstoqueFirestore(produto) {
  await adicionarItem('estoque', produto);
  window.dispatchEvent(new Event('estoqueAtualizado'));
}

export async function atualizarEstoqueFirestore(id, dados) {
  if (!id) return;
  await atualizarItem('estoque', { id, ...dados });
  window.dispatchEvent(new Event('estoqueAtualizado'));
}

export async function excluirProdutoEstoqueFirestore(id) {
  if (!id) return;
  await excluirItem('estoque', id);
  window.dispatchEvent(new Event('estoqueAtualizado'));
}

export async function reduzirQuantidadeProduto(nome, qtd = 1) {
  const itens = await buscarTodos('estoque');
  const prod = (itens || []).find(i => String(i.item).toLowerCase() === String(nome).toLowerCase());
  if (!prod) return;
  const atual = parseFloat(prod.quantidade || 0) || 0;
  const nova = atual - parseFloat(qtd || 1);
  await atualizarItem('estoque', { id: prod.id, ...prod, quantidade: nova });
  window.dispatchEvent(new Event('estoqueAtualizado'));
}

