// src/pages/Auth/EscolherPlano.jsx
import { useNavigate } from "react-router-dom";

export default function EscolherPlano() {
  const navigate = useNavigate();

  const PLANOS = [
    {
      id: "gratis",
      nome: "Grátis",
      descricao: "Teste limitado por 7 dias",
      preco: "R$0",
      funcionalidades: ["Produção de leite", "Reprodução", "Controle financeiro"],
    },
    {
      id: "basico",
      nome: "Básico",
      descricao: "Funcionalidades essenciais",
      preco: "R$29",
      funcionalidades: ["Leite", "Reprodução", "Financeiro"],
    },
    {
      id: "intermediario",
      nome: "Intermediário",
      descricao: "Plano intermediário",
      preco: "R$59",
      funcionalidades: ["Leite", "Reprodução", "Financeiro", "Estoque"],
    },
    {
      id: "completo",
      nome: "Completo",
      descricao: "Todos os recursos",
      preco: "R$89",
      funcionalidades: ["Leite", "Reprodução", "Financeiro", "Estoque", "Relatórios"],
    },
  ];

  // cor de destaque por plano (faixa superior e botão)
  const COR_PLANO = {
    gratis: "#22c55e",         // verde
    basico: "#3b82f6",         // azul
    intermediario: "#f59e0b",  // laranja
    completo: "#8b5cf6",       // roxo
  };

  const escolher = (planoId) => {
    navigate(`/cadastro?plano=${planoId}`, { replace: true });
  };

  return (
    <div className="pagina-escolher-plano">
      {/* CSS embutido */}
      <style>{`
        .pagina-escolher-plano {
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-image: url('/icones/telafundo.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: 20px;
        }
        .painel-planos {
          background-color: rgba(255, 255, 255, 0.85);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 1000px;
        }
        .painel-planos .titulo {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e3a8a;
        }
        .grid-planos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .card-plano-modern {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-plano-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        .faixa-superior {
          width: 100%;
          height: 6px;
          margin: -20px -20px 12px;
          border-radius: 16px 16px 0 0;
        }
        .card-plano-modern h2 {
          font-size: 1.25rem;
          font-weight: 600;
        }
        .card-plano-modern .preco {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 10px 0;
        }
        .card-plano-modern .lista-beneficios {
          flex: 1;
          margin: 0 0 16px 0;
          padding-left: 20px;
          list-style: disc;
          text-align: left;
        }
        .btn-escolher-moderno {
          border: none;
          color: #fff;
          font-weight: 600;
          padding: 0.6rem 1.2rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: filter 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-escolher-moderno:hover {
          filter: brightness(0.9);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .rodape-anotacao {
          text-align: center;
          font-size: 12px;
          color: #64748b;
          margin-top: 16px;
        }
      `}</style>

      <div className="painel-planos">
        <h1 className="titulo">Escolha seu Plano</h1>

        <div className="grid-planos">
          {PLANOS.map((p) => (
            <div key={p.id} className="card-plano-modern">
              <div
                className="faixa-superior"
                style={{ backgroundColor: COR_PLANO[p.id] || "#1e3a8a" }}
              />
              <h2>{p.nome}</h2>
              <p className="text-sm" style={{ color: "#475569", marginTop: 4 }}>
                {p.descricao}
              </p>

              <div className="preco">{p.preco}</div>

              <ul className="lista-beneficios">
                {p.funcionalidades.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <button
                className="btn-escolher-moderno"
                style={{ background: COR_PLANO[p.id] || "#1e3a8a" }}
                onClick={() => escolher(p.id)}
              >
                Selecionar plano
              </button>
            </div>
          ))}
        </div>

        <p className="rodape-anotacao">
          Você poderá alterar o plano mais tarde nas configurações.
        </p>
      </div>
    </div>
  );
}
