import React, { useState } from "react";

function idadeTexto(nascimento) {
  if (!nascimento || nascimento.length !== 10) return "—";
  const [d, m, a] = nascimento.split("/").map(Number);
  const dt = new Date(a, m - 1, d);
  const meses = Math.max(0, Math.floor((Date.now() - dt) / (1000 * 60 * 60 * 24 * 30.44)));
  return `${Math.floor(meses / 12)}a ${meses % 12}m`;
}

function del(parto) {
  if (!parto || parto.length !== 10) return "—";
  const [d, m, a] = parto.split("/").map(Number);
  const dt = new Date(a, m - 1, d);
  const dias = Math.max(0, Math.round((Date.now() - dt) / 86400000));
  return `${dias}`;
}

const tableClasses = "w-full border-separate [border-spacing:0_8px] text-sm text-[#333] table-fixed whitespace-nowrap";
const thBase = "bg-[#e6f0ff] px-4 py-3 text-left font-bold text-[#1e3a8a] border-b-2 border-[#a8c3e6] sticky top-0 z-10 cursor-pointer";
const tdBase = "px-5 py-4 border-b border-[#eee] overflow-hidden text-ellipsis";
const rowBase = "bg-white shadow-sm hover:bg-[#e0f2ff] transition-colors";
const rowAlt  = "even:bg-[#f3f4f6]";
const hoverTH = (i, hc) => (i === hc ? "bg-[rgba(33,150,243,0.08)]" : "");
const hoverTD = (i, hc) => (i === hc ? "bg-[rgba(33,150,243,0.08)]" : "");

export default function Plantel({ animais = [] }) {
  const [hoverCol, setHoverCol] = useState(null);
  const colunas = [
    "Número",
    "Brinco",
    "Lactações",
    "DEL",
    "Categoria",
    "Idade",
    "Últ. IA",
    "Parto",
    "Raça",
    "Pai",
    "Mãe",
    "Previsão Parto",
    "Ação",
  ];

  return (
    <div className="w-full px-8 py-6 font-sans">
      <table className={tableClasses}>
        <thead>
          <tr>
            {colunas.map((c, i) => (
              <th
                key={c}
                onMouseEnter={() => setHoverCol(i)}
                onMouseLeave={() => setHoverCol(null)}
                className={`${thBase} ${hoverTH(i, hoverCol)}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(animais) ? animais : []).map((v, idx) => {
            const row = [
              v.numero,
              v.brinco,
              v.n_lactacoes ?? "—",
              del(v.parto),
              v.categoria ?? "—",
              idadeTexto(v.nascimento),
              v.ultima_ia ?? "—",
              v.parto ?? "—",
              v.raca ?? "—",
              v.pai ?? "—",
              v.mae ?? "—",
              v.previsao_parto ?? "—",
              "",
            ];
            return (
              <tr key={idx} className={`${rowBase} ${rowAlt}`}>
                {colunas.map((_, i) => (
                  <td key={i} className={`${tdBase} ${hoverTD(i, hoverCol)}`}>
                    {row[i]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

