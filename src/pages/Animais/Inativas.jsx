// src/pages/Animais/Inativas.jsx
import React, { useMemo, useState } from 'react';

export default function Inativas({ animais = [], onAtualizar }) {
  const [colunaHover, setColunaHover] = useState(null);

  const lista = useMemo(
    () => (Array.isArray(animais) ? animais : []).filter(a => a.status === 'inativo'),
    [animais]
  );

  const reativar = (numero) => {
    const novaLista = (Array.isArray(animais) ? animais : []).map((v) =>
      String(v.numero) === String(numero)
        ? {
            ...v,
            status: 'ativo',
            saida: undefined,
            motivoSaida: undefined,
            dataSaida: undefined,
            valorVenda: undefined,
            observacoesSaida: undefined,
            tipoSaida: undefined,
          }
        : v
    );
    onAtualizar?.(novaLista);
  };

  const titulos = ['Número','Categoria','Tipo de Saída','Motivo','Data','Valor','Observações','Ações'];

  const fmtData = (d) => {
    if (!d) return '—';
    if (typeof d === 'string' && d.includes('/')) return d;
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('pt-BR');
  };

  const fmtValor = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    const num = typeof v === 'number'
      ? v
      : parseFloat(String(v).replace(/[^0-9,.-]/g, '').replace(',', '.'));
    return isNaN(num) ? v : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="w-full px-8 py-6 font-sans">
      <h2 className="text-xl font-bold mb-6">❌ Animais Inativos</h2>

      <table className="min-w-full border border-gray-300 rounded-md overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            {titulos.map((t, i) => (
              <th
                key={t}
                onMouseEnter={() => setColunaHover(i)}
                onMouseLeave={() => setColunaHover(null)}
                className={`px-3 py-2 text-left text-sm font-medium ${colunaHover === i ? 'bg-gray-200' : ''}`}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lista.map((a, idx) => {
            const dados = [
              a.numero || a.brinco || '—',
              a.categoria || a.tipo || '—',
              a.tipoSaida || a.saida?.tipo || '—',
              a.motivoSaida || a.saida?.motivo || '—',
              fmtData(a.dataSaida || a.saida?.data),
              fmtValor(a.valorVenda || a.valorSaida || a.saida?.valor),
              a.observacoesSaida || a.saida?.observacao || '—',
            ];

            return (
              <tr key={idx} className="border-t">
                {dados.map((c, i) => (
                  <td key={i} className={`px-3 py-2 text-sm ${colunaHover === i ? 'bg-gray-50' : ''}`}>
                    {c}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                      onClick={() => { /* abrir ficha completa no futuro */ }}
                    >
                      📋 Ver Ficha
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                      onClick={() => reativar(a.numero)}
                    >
                      🔁 Reativar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {lista.length === 0 && (
            <tr>
              <td colSpan={titulos.length} className="text-center py-4 text-gray-500">
                Nenhum animal inativo registrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
