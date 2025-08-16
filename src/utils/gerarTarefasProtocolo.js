import { addDays } from 'date-fns';
import { db, adicionarItem } from './backendApi';

export default async function gerarTarefasProtocolo(numero, protocolo) {
  if (!protocolo || !numero) return;

  for (const etapa of protocolo.etapas || []) {
    const data = addDays(new Date(), etapa.dia).toISOString().slice(0, 10);
    const tarefa = {
      numero,
      protocoloId: protocolo.id,
      etapa: `D${etapa.dia} - ${etapa.hormonio || etapa.acao}`,
      data,
      tipo: etapa.hormonio ? 'hormonal' : 'manejo',
      status: 'pendente',
    };
    await adicionarItem('tarefasGeradas', tarefa);
  }

  window.dispatchEvent(new Event('tarefasAtualizadas'));
}
