// Funções utilitárias para lidar com datas no formato DD/MM/AAAA
export function parseBRDate(dataStr) {
  if (!dataStr) return null;
  const [dia, mes, ano] = dataStr.split('/');
  return new Date(ano, mes - 1, dia);
}

export function diffDias(data) {
  if (!data) return null;
  const hoje = new Date();
  const d1 = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const d2 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
}
