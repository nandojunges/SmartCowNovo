export default function verificarValidadeProduto(validade, diasAlerta = 30) {
  if (!validade) {
    return { texto: '—', cor: 'gray' };
  }
  const hoje = new Date();
  const dataVal = new Date(validade);
  const diff = Math.ceil((dataVal - hoje) / (1000 * 60 * 60 * 24));

  if (dataVal < hoje) {
    return { texto: 'Vencido', cor: 'red', icone: '❌' };
  }
  if (diff <= diasAlerta) {
    return { texto: 'Vencendo', cor: 'orange', icone: '⚠️' };
  }
  return { texto: 'OK', cor: 'green', icone: '🟢' };
}
