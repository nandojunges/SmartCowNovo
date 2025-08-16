import { useEffect } from 'react';
import NavegacaoPrincipal from './NavegacaoPrincipal';
import { Outlet } from 'react-router-dom';
import executarDescontoDiario from '../utils/descontoDiario';
import "../styles/botoes.css";
import "../styles/tabelaModerna.css";

export default function SistemaBase() {
  useEffect(() => {
    executarDescontoDiario();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      <header
        className="bg-[#1e3a8a] w-full shadow-md flex items-center justify-center"
        style={{ minHeight: '130px' }}
      >
        <NavegacaoPrincipal contextoAzul />
      </header>

      <main className="flex flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
