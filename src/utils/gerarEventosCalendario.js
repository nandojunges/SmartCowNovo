import { buscarTodosAnimais } from '../api';
import { buscarTodos } from './backendApi';

export default async function gerarEventosCalendario() {
  const eventos = [];

  const toISO = (data) => {
    if (!data) return null;
    if (data.includes('-')) return data;
    const [d, m, a] = data.split('/');
    if (!d || !m || !a) return null;
    return `${a.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const animais = await buscarTodosAnimais();

  for (const a of animais) {
    let partos = [];
    try {
      partos = await buscarTodos(`parto_${a.numero}`);
    } catch (e) {
      if (e?.status === 404) {
        console.warn(
          `⚠️ Não foi possível carregar partos: rota /parto_${a.numero} ainda não criada.`
        );
      }
    }
    partos.forEach((registro) => {
      if (registro?.data) {
        eventos.push({
          title: `Parto - Vaca ${a.numero}`,
          date: toISO(registro.data),
          tipo: 'parto',
          color: '#6C63FF',
          prioridadeVisual: true,
        });
      }
    });

    let secagens = [];
    try {
      secagens = await buscarTodos(`secagem_${a.numero}`);
    } catch (e) {
      if (e?.status === 404) {
        console.warn(
          `⚠️ Não foi possível carregar secagens: rota /secagem_${a.numero} ainda não criada.`
        );
      }
    }
    secagens.forEach((registro) => {
      if (registro?.dataSecagem) {
        eventos.push({
          title: `Secagem - Vaca ${a.numero}`,
          date: toISO(registro.dataSecagem),
          tipo: 'secagem',
          color: '#8E44AD',
          prioridadeVisual: true,
        });
      }
    });
  }

  animais.forEach((a) => {
    if (a.dataPrevistaParto) {
      const [d, m, y] = a.dataPrevistaParto.split('/').map(Number);
      const data = new Date(y, m - 1, d);
      data.setDate(data.getDate() - 21);
      eventos.push({
        title: `Pré-parto - ${a.numero}`,
        date: data.toISOString().split('T')[0],
        tipo: 'preparto',
        color: '#2980B9',
        prioridadeVisual: true
      });
    }
  });

  let vacinas = [];
  try {
    vacinas = await buscarTodos('manejosSanitarios');
  } catch (e) {
    if (e?.status === 404) {
      console.warn('⚠️ Não foi possível carregar vacinas: rota /manejosSanitarios ainda não criada.');
    }
  }
  vacinas.forEach((v) => {
    const data = toISO(v.proximaAplicacao || v.dataInicial);
    if (data) {
      eventos.push({
        title: `Vacina - ${v.produto}`,
        date: data,
        tipo: 'vacina',
        color: '#27AE60',
        prioridadeVisual: true
      });
    }
  });

  let exames = [];
  try {
    exames = await buscarTodos('examesSanitarios');
  } catch (e) {
    if (e?.status === 404) {
      console.warn(
        '⚠️ Não foi possível carregar exames sanitários: rota /examesSanitarios ainda não criada.'
      );
    }
  }
  if (Array.isArray(exames) && exames.length) {
    exames.forEach((e) => {
      const data = toISO(e.validadeCertificado || e.proximaObrigatoriedade);
      if (data) {
        eventos.push({
          title: `Exame - ${e.tipo || e.nome}`,
          date: data,
          tipo: 'exame',
          color: '#F39C12',
          prioridadeVisual: true
        });
      }
    });
  }

  let ciclos = [];
  try {
    ciclos = await buscarTodos('ciclosLimpeza');
  } catch (e) {
    if (e?.status === 404) {
      console.warn('⚠️ Não foi possível carregar ciclos de limpeza: rota /ciclosLimpeza ainda não criada.');
    }
  }
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    ciclos.forEach((c) => {
      if (c.diasSemana?.includes(d.getDay())) {
        eventos.push({
          title: `Limpeza - ${c.nome}`,
          date: d.toISOString().split('T')[0],
          tipo: 'limpeza',
          color: '#3498DB',
          prioridadeVisual: false
        });
      }
    });
  }

  let produtos = [];
  try {
    produtos = await buscarTodos('produtos');
  } catch (e) {
    if (e?.status === 404) {
      console.warn('⚠️ Não foi possível carregar produtos: rota /produtos ainda não criada.');
    }
  }
  if (!Array.isArray(produtos) || !produtos.length) return [];
  produtos.forEach((p) => {
    if (p.validade) {
      const data = toISO(p.validade);
      if (data) {
        eventos.push({
          title: `Validade - ${p.nomeComercial}`,
          date: data,
          tipo: 'estoque',
          color: '#E74C3C',
          prioridadeVisual: true
        });
      }
    }
    if (p.alertaEstoque && p.alertaEstoque.match(/Previsto esgotar em (\d+)/)) {
      const dias = parseInt(p.alertaEstoque.match(/Previsto esgotar em (\d+)/)[1]);
      const data = new Date();
      data.setDate(data.getDate() + dias);
      eventos.push({
        title: `⚠️ Produto ${p.nomeComercial} esgotando`,
        date: data.toISOString().split('T')[0],
        tipo: 'estoque',
        color: '#E74C3C',
        prioridadeVisual: true
      });
    }
  });

  animais.forEach((a) => {
    const temProtocolo = a.protocoloAtivo && a.protocoloAtivo.status === 'ativo';
    if (!temProtocolo) return;
    (a.protocoloAtivo.etapasProgramadas || []).forEach((et) => {
      const acao = (et.acao || '').toLowerCase();
      let icon = '💉';
      if (acao.includes('insemin')) icon = '🐂';
      else if (acao.includes('dispositivo')) icon = '🔄';
      else if (!et.subtipo && !acao.includes('horm')) icon = '📌';

      eventos.push({
        title: `${et.acao}${et.subtipo ? ' — ' + et.subtipo : ''} (Vaca ${a.numero})`,
        date: et.data,
        tipo: 'protocolo',
        categoria: 'protocolo',
        vaca: a.numero,
        acao: et.acao,
        principioAtivo: et.subtipo,
        status: et.status,
        color: '#FF66C4',
        prioridadeVisual: true,
        icon,
      });
    });
  });

  for (const a of animais) {
    let registro = [];
    try {
      registro = await buscarTodos(`registroReprodutivo_${a.numero}`);
    } catch (e) {
      if (e?.status === 404) {
        console.warn(
          `⚠️ Não foi possível carregar registros reprodutivos: rota /registroReprodutivo_${a.numero} ainda não criada.`
        );
      }
    }
    (registro || []).forEach((oc) => {
      const dataEvento = toISO(oc.data);
      if (
        dataEvento &&
        (oc.tipo === 'iatf' ||
          oc.tipo === 'dispositivo' ||
          oc.tipo === 'hormonio' ||
          oc.tipo === 'aplicacao')
      ) {
        eventos.push({
          title: `${oc.tipo.toUpperCase()} - Vaca ${a.numero}`,
          date: dataEvento,
          tipo: oc.tipo,
          color: oc.tipo === 'iatf' ? '#E74C3C' : '#3498DB',
          prioridadeVisual: true,
        });
      }
    });
  }

  return eventos;
}
