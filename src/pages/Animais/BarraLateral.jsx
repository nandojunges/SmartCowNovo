import React from 'react';
import {
  ListChecks, PlusCircle, ArrowRightCircle, Ban,
  FileText, UploadCloud, DownloadCloud,
} from 'lucide-react';

const estilos = {
  larguraExpandida: 130,
  larguraRecolhida: 50,
  alturaBotao: 50,
  espacoEntreBotoes: 10,
  iconeExpandido: 24,
  iconeRecolhido: 28,                // ligeiramente menor p/ recolhido ficar clean
  corAtivo: 'bg-white text-blue-900 shadow-md',
  corInativo: 'bg-gray-100 text-black',
  fonte: 'Poppins, sans-serif',
};

const icones = {
  todos: <ListChecks />,
  entrada: <PlusCircle />,
  saida: <ArrowRightCircle />,
  inativas: <Ban />,
  relatorio: <FileText />,
  importar: <UploadCloud />,
  exportar: <DownloadCloud />,
};

export default function ModalLateralAnimais({ abaAtiva, setAbaAtiva, expandido }) {
  const botoes = [
    { id: 'todos', label: 'Todos os Animais' },
    { id: 'entrada', label: 'Entrada de Animais' },
    { id: 'saida', label: 'Saída de Animais' },
    { id: 'inativas', label: 'Inativas' },
    { id: 'relatorio', label: 'Relatórios' },
    { id: 'importar', label: 'Importar Dados' },
    { id: 'exportar', label: 'Exportar Dados' },
  ];

  return (
    <div
      className="flex flex-col"
      style={{
        gap: estilos.espacoEntreBotoes,
        padding: '8px 0 8px 0',  // sem padding esquerdo/direito; encosta na borda
        height: '100%',
        overflowY: 'auto',       // rola se faltar altura
      }}
    >
      {botoes.map((btn) => {
        const ativo = abaAtiva === btn.id;
        return (
          <button
            key={btn.id}
            onClick={() => setAbaAtiva(btn.id)}
            title={btn.label}
            className={`flex items-center group transition-all duration-300 ease-in-out
              ${ativo ? estilos.corAtivo : estilos.corInativo}`}
            style={{
              height: estilos.alturaBotao,
              width: expandido ? estilos.larguraExpandida : estilos.larguraRecolhida,
              minWidth: 44,
              justifyContent: expandido ? 'flex-start' : 'center',
              borderTopLeftRadius: 0,          // lado esquerdo reto, encostado na borda
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 9999,
              borderBottomRightRadius: 9999,
              paddingLeft: expandido ? 12 : 0,
              paddingRight: expandido ? 12 : 0,
              fontFamily: estilos.fonte,
              fontSize: 14,
              position: 'relative',
            }}
          >
            {/* filete de destaque no ativo */}
            {ativo && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-blue-800" />
            )}

            {/* Ícone */}
            <span className="flex items-center justify-center">
              {React.cloneElement(icones[btn.id], {
                size: expandido ? estilos.iconeExpandido : estilos.iconeRecolhido,
              })}
            </span>

            {/* Texto */}
            <span
              className="ml-2 overflow-hidden transition-all duration-300 ease-in-out group-hover:font-bold"
              style={{
                opacity: expandido ? 1 : 0,
                maxWidth: expandido ? 160 : 0,
                transform: expandido ? 'translateX(0)' : 'translateX(-8px)',
                fontWeight: ativo ? 700 : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              {btn.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
