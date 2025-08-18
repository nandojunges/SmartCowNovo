// src/layout/SistemaBase.jsx
import NavegacaoPrincipal from "./NavegacaoPrincipal";
import { Outlet } from "react-router-dom";
import "../styles/botoes.css";
import "../styles/tabelaModerna.css";

export default function SistemaBase() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      <header
        className="bg-[#1e3a8a] w-full shadow-md"
        style={{ minHeight: 130 }}
      >
        {/* container da barra de navegação */}
        <div className="max-w-[1600px] mx-auto">
          <NavegacaoPrincipal />
        </div>
      </header>

      {/* conteúdo das páginas (renderizado pelas rotas filhas) */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto w-full p-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
