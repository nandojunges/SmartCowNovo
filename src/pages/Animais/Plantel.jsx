import React, { useState } from "react";

function calcPrevisaoParto(brDate) {
  if (!brDate || brDate.length !== 10) return null;
  const [d, m, y] = brDate.split("/");
  const dt = new Date(`${y}-${m}-${d}`);
  dt.setDate(dt.getDate() + 280);
  return dt.toLocaleDateString("pt-BR");
}

const tableClasses = "w-full border-separate [border-spacing:0_8px] text-sm text-[#333] table-fixed whitespace-nowrap";
const thBase = "bg-[#e6f0ff] px-4 py-3 text-left font-bold text-[#1e3a8a] border-b-2 border-[#a8c3e6] sticky top-0 z-10 cursor-pointer";
const tdBase = "px-5 py-4 border-b border-[#eee] overflow-hidden text-ellipsis";
const rowBase = "bg-white shadow-sm hover:bg-[#e0f2ff] transition-colors";
const rowAlt  = "even:bg-[#f3f4f6]";
const hoverTH = (i, hc) => i===hc ? "bg-[rgba(33,150,243,0.08)]" : "";
const hoverTD = (i, hc) => i===hc ? "bg-[rgba(33,150,243,0.08)]" : "";

export default function Plantel({ animais = [] }) {
  const [hoverCol, setHoverCol] = useState(null);
  const colunas = ["Número","Brinco","Lactações","DEL","Categoria","Idade","Últ. IA","Parto","Raça","Pai","Mãe","Previsão Parto","Ação"];

  return (
    <div className="w-full px-8 py-6 font-sans">
      <table className={tableClasses}>
        <thead>
          <tr>
            {colunas.map((c, i) => (
              <th key={c}
                  onMouseEnter={() => setHoverCol(i)}
                  onMouseLeave={() => setHoverCol(null)}
                  className={`${thBase} ${hoverTH(i, hoverCol)}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(animais) ? animais : []).map((v, idx) => {
            const lastCalving = v.ultimoParto || (v.partos?.length ? v.partos[v.partos.length - 1].data : "—");
            const row = [
              v.numero, v.brinco, v.nLactacoes ?? "—", v.del ?? "—", v.categoria, v.idade,
              v.ultimaIA || "—", lastCalving, v.raca, v.pai || "—", v.mae || "—",
              calcPrevisaoParto(v.ultimaIA) || "—", ""
            ];
            return (
              <tr key={idx} className={`${rowBase} ${rowAlt}`}>
                {colunas.map((_, i) => (
                  <td key={i} className={`${tdBase} ${hoverTD(i, hoverCol)}`}>{row[i]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
