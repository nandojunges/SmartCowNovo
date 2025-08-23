import React, { useState } from "react";

function parseBR(br){ if(!br) return null; const [d,m,y]=br.split("/"); return new Date(`${y}-${m}-${d}`); }
function diffDays(target){ if(!target) return null; const a=new Date();a.setHours(0,0,0,0); const b=new Date(target);b.setHours(0,0,0,0); return Math.ceil((b-a)/(1000*60*60*24)); }

const tableClasses = "w-full border-separate [border-spacing:0_8px] text-sm text-[#333] table-fixed whitespace-nowrap";
const thBase = "bg-[#e6f0ff] px-4 py-3 text-left font-bold text-[#1e3a8a] border-b-2 border-[#a8c3e6] sticky top-0 z-10 cursor-pointer";
const tdBase = "px-5 py-4 border-b border-[#eee] overflow-hidden text-ellipsis";
const rowBase = "bg-white shadow-sm hover:bg-[#e0f2ff] transition-colors";
const rowAlt  = "even:bg-[#f3f4f6]";
const hoverTH = (i, hc) => i===hc ? "bg-[rgba(33,150,243,0.08)]" : "";
const hoverTD = (i, hc) => i===hc ? "bg-[rgba(33,150,243,0.08)]" : "";

export default function Parto({ animais = [] }) {
  const [hoverCol, setHoverCol] = useState(null);
  const colunas = ["Número","Brinco","Lactações","DEL","Categoria","Idade","Últ. IA","Último Parto","Raça","Pai","Mãe","Previsão de Parto","Ação"];

  const lista = (Array.isArray(animais) ? animais : []).filter((v) => {
    const d = parseBR(v.dataPrevistaParto);
    const dif = d ? diffDays(d) : null;
    return v.status === 1 && dif !== null && dif <= 0;
  });

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
          {lista.map((v, idx) => {
            const row = [
              v.numero, v.brinco, v.nLactacoes ?? "—", v.del ?? "—", v.categoria, v.idade,
              v.ultimaIA || "—", v.ultimoParto || "—", v.raca, v.pai || "—", v.mae || "—",
              v.dataPrevistaParto || "—", ""
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
