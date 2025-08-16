import { buscarAnimalPorNumero, atualizarAnimalNoBanco } from '../api';

const TIPOS = [
  'partos',
  'inseminacoes',
  'secagens',
  'diagnosticos',
  'tratamentos',
  'saidas'
];

export async function adicionarEventoHistorico(animal, tipo, dadosEvento) {
  if (!animal || !tipo || !dadosEvento) return null;

  const numero = animal.numero;
  if (!numero) return null;

  let atual = await buscarAnimalPorNumero(numero);
  if (!atual) atual = { ...animal };

  if (!atual.historico) {
    atual.historico = {};
  }

  // garante arrays de todos os tipos para evitar sobrescrita
  for (const t of TIPOS) {
    if (!Array.isArray(atual.historico[t])) {
      atual.historico[t] = [];
    }
  }

  if (!TIPOS.includes(tipo)) {
    if (!Array.isArray(atual.historico[tipo])) {
      atual.historico[tipo] = [];
    }
  }

  atual.historico[tipo].push({
    ...dadosEvento,
    registradoEm: new Date().toISOString()
  });

  await atualizarAnimalNoBanco({ ...atual, id: atual.id });
  // também dispara evento local para atualizar telas que escutam
  window.dispatchEvent(new Event('animaisAtualizados'));

  return atual;
}
