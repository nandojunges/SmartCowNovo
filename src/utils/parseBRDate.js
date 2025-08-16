export default function parseBRDate(dataStr) {
  if (!dataStr) return null;
  const [dia, mes, ano] = dataStr.split('/');
  return new Date(ano, mes - 1, dia);
}
