// src/pages/Animais/SaidaAnimal.jsx
import React, { useMemo, useState } from 'react';
import Select from 'react-select';

export default function SaidaAnimal({ animais = [], onAtualizar }) {
  const [animalSelecionado, setAnimalSelecionado] = useState(null);
  const [tipo, setTipo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState('');
  const [observacao, setObservacao] = useState('');
  const [valor, setValor] = useState('');
  const [erros, setErros] = useState({});
  const [ok, setOk] = useState('');

  const motivosVenda = [
    'Baixa produção','Problemas reprodutivos','Problemas de casco','Excesso de animais',
    'Venda para outro produtor','Renovação genética','Problemas de temperamento','Troca de categoria'
  ];
  const motivosMorte = [
    'Doença grave','Acidente','Problemas no parto','Mastite grave','Senilidade',
    'Infecção generalizada','Problema respiratório','Morte súbita','Outras causas'
  ];

  const opcoesTipo = [
    { value: 'venda', label: '💰 Venda' },
    { value: 'morte', label: '☠️ Morte' },
    { value: 'doacao', label: '🎁 Doação' },
  ];
  const opcoesMotivo = (t) =>
    (t === 'venda' ? motivosVenda : t === 'morte' ? motivosMorte : [])
      .map(x => ({ value: x, label: x }));

  const formatarData = (v) => {
    const s = (v || '').replace(/\D/g, '').slice(0, 8);
    const d = s.slice(0, 2), m = s.slice(2, 4), y = s.slice(4, 8);
    return [d, m, y].filter(Boolean).join('/');
  };
  const formatarMoeda = (v) => {
    const n = parseFloat((v || '').replace(/\D/g, '') || 0) / 100;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const validar = () => {
    const e = {};
    if (!animalSelecionado) e.animal = 'Selecione um animal válido.';
    if (!tipo) e.tipo = 'Obrigatório.';
    if (!motivo) e.motivo = 'Obrigatório.';
    if ((data || '').length !== 10) e.data = 'Data inválida.';
    if (tipo === 'venda' && !valor) e.valor = 'Informe o valor da venda.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validar()) return;

    const numeroAlvo = String(animalSelecionado?.value);
    const novaLista = (Array.isArray(animais) ? animais : []).map((a) => {
      if (String(a.numero) !== numeroAlvo) return a;

      const saida = {
        tipo,
        motivo,
        data,
        observacao,
        valor: tipo === 'venda' ? valor : undefined,
        dataISO: new Date().toISOString(),
        idSaida: Date.now(),
      };

      return {
        ...a,
        status: 'inativo',
        saida,
        motivoSaida: saida.motivo,
        dataSaida: saida.data,
        valorVenda: saida.valor,
        observacoesSaida: saida.observacao,
        tipoSaida: saida.tipo,
      };
    });

    onAtualizar?.(novaLista);

    setOk('✅ Saída registrada com sucesso!');
    setTimeout(() => setOk(''), 3000);
    setAnimalSelecionado(null); setTipo(''); setMotivo(''); setData(''); setObservacao(''); setValor('');
  };

  const opcoesAnimais = useMemo(
    () => (Array.isArray(animais) ? animais : [])
      .filter(a => a.status !== 'inativo')
      .map(a => ({ value: a.numero, label: `${a.numero} – Brinco ${a.brinco || '—'}` })),
    [animais]
  );

  return (
    <div className="max-w-[1100px] mx-auto font-[Poppins,sans-serif] px-4 pt-0 pb-4 -mt-4">
      <div className="bg-white p-8 rounded-2xl shadow-md">
        {ok && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-400 px-4 py-3 rounded mb-6 font-medium flex items-center gap-2">
            {ok}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="font-semibold">Animal</label>
            <Select options={opcoesAnimais} value={animalSelecionado} onChange={setAnimalSelecionado} placeholder="Digite o número ou brinco" />
            {erros.animal && <div className="text-red-600 text-sm mt-1">{erros.animal}</div>}
          </div>

          <div>
            <label className="font-semibold">Tipo de saída</label>
            <Select
              options={opcoesTipo}
              value={opcoesTipo.find(x => x.value === tipo) || null}
              onChange={(e) => { setTipo(e.value); setMotivo(''); }}
              placeholder="Selecione o tipo"
            />
            {erros.tipo && <div className="text-red-600 text-sm mt-1">{erros.tipo}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="font-semibold">Motivo</label>
            <Select
              options={opcoesMotivo(tipo)}
              value={motivo ? { value: motivo, label: motivo } : null}
              onChange={(e) => setMotivo(e.value)}
              placeholder="Selecione o motivo"
              isDisabled={!tipo}
            />
            {erros.motivo && <div className="text-red-600 text-sm mt-1">{erros.motivo}</div>}
          </div>
          <div>
            <label className="font-semibold">Data</label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(formatarData(e.target.value))}
              placeholder="dd/mm/aaaa"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base"
            />
            {erros.data && <div className="text-red-600 text-sm mt-1">{erros.data}</div>}
          </div>
        </div>

        {tipo === 'venda' && (
          <div className="mt-6">
            <label className="font-semibold">Valor da venda (R$)</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(formatarMoeda(e.target.value))}
              placeholder="Digite o valor da venda"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base"
            />
            {erros.valor && <div className="text-red-600 text-sm mt-1">{erros.valor}</div>}
          </div>
        )}

        <div className="mt-6">
          <label className="font-semibold">Observações</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional"
            className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base h-20 resize-y"
          />
        </div>

        <div className="mt-8 flex justify-start">
          <button
            onClick={submit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            💾 Registrar Saída
          </button>
        </div>
      </div>
    </div>
  );
}
