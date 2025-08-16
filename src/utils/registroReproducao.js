import { addDays } from 'date-fns';
import { formatarDataBR } from '../pages/Animais/utilsAnimais';
import { buscarTodosAnimais } from '../api';
import {
  buscarTodos,
  adicionarItem,
  atualizarItem,
  excluirItem,
  buscarPorId,
} from './backendApi';

export async function carregarRegistroFirestore(numero) {
  if (!numero) return { ocorrencias: [] };
  const todos = await buscarTodos('registroReprodutivo');
  const ocorrencias = (todos || []).filter(o => String(o.numero) === String(numero));
  return { ocorrencias };
}

export async function carregarRegistroReprodutivo(numero) {
  return carregarRegistroFirestore(numero);
}

export async function adicionarOcorrenciaFirestore(numero, ocorrencia) {
  if (!numero || !ocorrencia) return;
  await adicionarItem('registroReprodutivo', { numero, ...ocorrencia });

  if (ocorrencia.protocoloId) {
    await registrarProtocoloAtivo(numero, ocorrencia.protocoloId, ocorrencia.data);
  }

  window.dispatchEvent(new Event('registroReprodutivoAtualizado'));
}

export async function excluirOcorrenciaFirestore(idOcorrencia) {
  if (!idOcorrencia) return;
  await excluirItem('registroReprodutivo', idOcorrencia);
  window.dispatchEvent(new Event('registroReprodutivoAtualizado'));
}

const BASE_URL = '/api';

export async function carregarRegistro(numero) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/reproducao/${numero}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await res.json();
}

export async function salvarRegistro(numero, dados) {
  if (!numero) return;
  const token = localStorage.getItem('token');
  await fetch(`${BASE_URL}/reproducao/${numero}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados),
  });
}

export async function adicionarOcorrencia(numero, ocorrencia) {
  return adicionarOcorrenciaFirestore(numero, ocorrencia);
}

// ✅ VERSÃO CORRIGIDA
export function calcularProximaEtapa(protocolo, inicio) {
  if (
    !protocolo ||
    !inicio ||
    !Array.isArray(protocolo.etapas)
  ) return null;

  const [d, m, a] = inicio.split('/');
  const dataBase = new Date(`${a}-${m}-${d}`);
  const hoje = new Date();

  const etapasOrdenadas = protocolo.etapas
    .filter(et => et && typeof et.dia === 'number')
    .slice()
    .sort((a, b) => a.dia - b.dia);

  for (const et of etapasOrdenadas) {
    const data = addDays(dataBase, et.dia);
    if (data >= hoje) {
      const nome = et.hormonio || et.acao || 'Etapa';
      return { nome, data: formatarDataBR(data) };
    }
  }

  return null;
}

export function calcularEtapasOcorrencia(ocorrencia) {
  if (!ocorrencia || !Array.isArray(ocorrencia.etapas)) {
    return { ultima: null, proxima: null };
  }

  const [d, m, a] = ocorrencia.data.split('/');
  const inicio = new Date(`${a}-${m}-${d}`);
  const hoje = new Date();
  const etapasOrdenadas = [...ocorrencia.etapas].sort((x, y) => x.dia - y.dia);

  let ultima = { tipo: ocorrencia.tipo, data: ocorrencia.data };
  let proxima = null;

  for (const et of etapasOrdenadas) {
    const dataEtapa = addDays(inicio, et.dia);
    const nome = et.acao || et.hormonio || 'Etapa';
    if (dataEtapa <= hoje) {
      ultima = { tipo: nome, data: formatarDataBR(dataEtapa) };
    } else if (!proxima) {
      proxima = { tipo: nome, dataPrevista: formatarDataBR(dataEtapa) };
    }
  }

  if (!proxima) proxima = { tipo: 'Protocolo concluído', dataPrevista: '—' };

  return { ultima, proxima };
}

export async function listarAnimaisPorProtocolo(protocolId) {
  if (!protocolId) return [];

  const ativos = await buscarTodos('statusProtocolosAtivos');
  const animais = await buscarTodosAnimais();
  const filtrados = ativos.filter((a) => a.protocoloId === protocolId);

  const result = [];
  for (const a of filtrados) {
    const vaca = animais.find((v) => v.numero === a.numero) || {};
    const registro = await carregarRegistro(a.numero);
    const r = (registro.ocorrencias || []).find(
      (t) => t.protocoloId === protocolId && !t.concluido
    );

    result.push({
      numero: a.numero,
      nome: vaca.brinco || vaca.nome || '',
      dataInicio: a.dataUltimaAcao || a.dataInicio || '',
      proximaAcao: r?.proximaEtapa?.nome || null,
      proximaData: r?.proximaEtapa?.data || null,
      status: r?.concluido ? 'Concluído' : 'Em andamento',
    });
  }

  return result;
}

export async function listarVacasAtivasNoProtocolo(protocolId) {
  if (!protocolId) return [];

  const protocolos = await buscarTodos('protocolos');
  const prot = protocolos.find((p) => String(p.id) === String(protocolId));
  if (!prot || !Array.isArray(prot.vacasAtivas)) return [];

   const animais = await buscarTodosAnimais();
  return prot.vacasAtivas
    .map((num) => animais.find((a) => a.numero === num))
    .filter(
      (v) =>
        v &&
        v.protocoloAtivo &&
        String(v.protocoloAtivo.protocoloId) === String(protocolId)
    )
    .map((v) => {
      const prox = (v.protocoloAtivo?.etapasProgramadas || []).find(
        (e) => e.status === 'pendente'
      );
      return {
        numero: v.numero,
        brinco: v.brinco || v.nome || '',
        inicio: v.protocoloAtivo?.inicio || '—',
        proximaAcao: prox ? prox.acao : null,
        proximaData: prox ? prox.data.split('-').reverse().join('/') : null,
      };
    });
}

export async function registrarProtocoloAtivo(
  numero,
  protocoloId,
  dataInicio,
  proximaAcao = '',
  dataProximaAcao = '',
  nomeProtocolo = ''
) {
  if (!numero || !protocoloId || !dataInicio) return;
  await atualizarItem('statusProtocolosAtivos', {
    id: String(numero),
    numero: String(numero),
    protocoloId,
    nomeProtocolo,
    ultimaAcao: 'Início do protocolo',
    dataUltimaAcao: dataInicio,
    proximaAcao,
    dataProximaAcao,
    status: 'em andamento',
  });
  window.dispatchEvent(new Event('protocolosAtivosAtualizados'));
}

export async function iniciarProtocoloParaAnimal(animal, protocoloSelecionado, dataInicio, implanteUso = null) {
  if (!animal || !protocoloSelecionado || !dataInicio) return;

  const inicio = new Date(
    dataInicio.includes('/') ? dataInicio.split('/').reverse().join('-') : dataInicio
  );

  const etapasProgramadas = (protocoloSelecionado.etapas || []).map((etapa) => {
    const dataPrevista = new Date(inicio);
    dataPrevista.setDate(dataPrevista.getDate() + etapa.dia);
    const obj = {
      data: dataPrevista.toISOString().split('T')[0],
      acao: etapa.acao || 'Aplicar Hormônio',
      subtipo: etapa.hormonio || null,
      status: 'pendente',
    };
    if ((etapa.acao || '').toLowerCase().includes('inserir dispositivo') ||
        (etapa.acao || '').toLowerCase().includes('retirar dispositivo')) {
      obj.implanteUso = implanteUso;
    }
    return obj;
  });

  const animais = await buscarTodosAnimais();
  const novosAnimais = animais.map((a) => {
    if (a.numero === animal.numero) {
      a.protocoloAtivo = {
        protocoloId: protocoloSelecionado.id,
        nome: protocoloSelecionado.nome,
        tipo: protocoloSelecionado.tipo,
        inicio: dataInicio,
        etapasProgramadas,
        status: 'ativo',
      };
    }
    return a;
  });
  await adicionarItem('animais', novosAnimais);

  const protocolos = await buscarTodos('protocolos');
  const novosProtocolos = protocolos.map((p) => {
    if (p.id === protocoloSelecionado.id) {
      const set = new Set([...(p.vacasAtivas || []), animal.numero]);
      p.vacasAtivas = Array.from(set);
    }
    return p;
  });
  await adicionarItem('protocolos', novosProtocolos);
}

export async function removerProtocoloAtivo(animal, limparRegistro = false) {
  const numero = typeof animal === 'object' ? animal.numero : animal;
  if (!numero) return;

  await cancelarProtocoloAtivo(numero);

  if (limparRegistro) {
    // histórico de reprodução mantido apenas no Firestore
  }
}

export async function cancelarProtocoloAtivo(numeroAnimal) {
  const animais = await buscarTodosAnimais();
  const atualizados = animais.map((a) => {
    if (a.numero === numeroAnimal) {
      delete a.protocoloAtivo;
    }
    return a;
  });
  await adicionarItem('animais', atualizados);

  const protocolos = await buscarTodos('protocolos');
  const atualizadosProt = protocolos.map((p) => ({
    ...p,
    vacasAtivas: (p.vacasAtivas || []).filter((v) => v !== numeroAnimal),
  }));
  await adicionarItem('protocolos', atualizadosProt);

  await excluirItem('statusProtocolosAtivos', String(numeroAnimal));

  const tarefas = await buscarTodos('tarefas');
  const tarefasFiltradas = tarefas.filter((t) => {
    if (t.origem === 'protocolo' && String(t.numero) === String(numeroAnimal)) return false;
    if (String(t.animal) === String(numeroAnimal)) return false;
    if (String(t.animalNumero) === String(numeroAnimal)) return false;
    if (t.descricao && t.descricao.includes(`Vaca ${numeroAnimal}`)) return false;
    return true;
  });
  await adicionarItem('tarefas', tarefasFiltradas);

  const ativo = await buscarPorId('statusProtocolosAtivos', String(numeroAnimal));
  if (ativo?.protocoloId) {
    const eventos = await buscarTodos('eventosCalendario');
    const restantes = eventos.filter(
      (e) => e.protocoloId !== ativo.protocoloId
    );
    await adicionarItem('eventosCalendario', restantes);
  }

  const extras = await buscarTodos('eventosExtras');
  const extrasFiltrados = extras.filter(
    (e) =>
      !(
        e.tipo === 'protocolo' &&
        (String(e.animal) === String(numeroAnimal) || String(e.vaca) === String(numeroAnimal))
      )
  );
  await adicionarItem('eventosExtras', extrasFiltrados);

  const principiosAtivosEmUso = new Set();
  atualizados.forEach((a) => {
    if (a.protocoloAtivo?.status === 'ativo') {
      (a.protocoloAtivo.etapasProgramadas || []).forEach((et) => {
        if (et.subtipo) principiosAtivosEmUso.add(et.subtipo);
      });
    }
  });

  const avisos = await buscarTodos('avisos');
  const avisosFiltrados = avisos.filter((av) => {
    if (!av.msg || !av.msg.includes('Estoque insuficiente para aplicação de')) return true;
    const match = av.msg.match(/Estoque insuficiente para aplicação de (.+?)\./);
    if (!match) return true;
    return principiosAtivosEmUso.has(match[1]);
  });
  await adicionarItem('avisos', avisosFiltrados);

  window.dispatchEvent(new Event('tarefasAtualizadas'));
  window.dispatchEvent(new Event('atualizarCalendario'));
  window.dispatchEvent(new Event('registroReprodutivoAtualizado'));
  window.dispatchEvent(new Event('protocolosAtivosAtualizados'));
}

export async function limparTarefasDoProtocolo(numeroVaca) {
  const todas = await buscarTodos('tarefas');
  const filtradas = todas.filter(
    (t) => !(t.origem === 'protocolo' && t.numero === numeroVaca)
  );
  await adicionarItem('tarefas', filtradas);
  window.dispatchEvent(new Event('tarefasAtualizadas'));
}
