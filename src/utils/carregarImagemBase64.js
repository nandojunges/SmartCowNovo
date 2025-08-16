export default async function carregarImagemBase64(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) {
    throw new Error(
      `Falha no fetch ${caminho}: ${resposta.status} ${resposta.statusText}`
    );
  }
  const blob = await resposta.blob();
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onloadend = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(blob);
  });
}
