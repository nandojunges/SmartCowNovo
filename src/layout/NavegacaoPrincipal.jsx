import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jwtDecode from "jwt-decode";

// Base de abas
const ABAS_BASE = [
  { id: "inicio",        label: "INÍCIO",                 icone: "/icones/home.png",        title: "Página inicial",            visivelPara: ["admin", "funcionario"] },
  { id: "animais",       label: "ANIMAIS",                icone: "/icones/plantel.png",     title: "Controle de animais",       visivelPara: ["admin", "funcionario"] },
  { id: "bezerras",      label: "BEZERRAS",               icone: "/icones/bezerra.png",     title: "Controle das bezerras",     visivelPara: ["admin", "funcionario"] },
  { id: "reproducao",    label: "REPRODUÇÃO",             icone: "/icones/reproducao.png",  title: "Reprodução e fertilidade",  visivelPara: ["admin", "funcionario"] },
  { id: "leite",         label: "LEITE",                  icone: "/icones/leite.png",       title: "Controle leiteiro",         visivelPara: ["admin", "funcionario"] },
  { id: "saude",         label: "SAÚDE",                  icone: "/icones/saude.png",       title: "Controle sanitário",        visivelPara: ["admin", "funcionario"] },
  { id: "consumo",       label: "CONSUMO E REPOSIÇÃO",    icone: "/icones/estoque.png",     title: "Gestão de estoque",         visivelPara: ["admin", "funcionario"] },
  { id: "financeiro",    label: "FINANCEIRO",             icone: "/icones/financeiro.png",  title: "Relatórios financeiros",    visivelPara: ["admin", "funcionario"] },
  { id: "calendario",    label: "CALENDÁRIO",             icone: "/icones/calendario.png",  title: "Agenda de atividades",      visivelPara: ["admin", "funcionario"] },
  { id: "ajustes",       label: "AJUSTES",                icone: "/icones/indicadores.png", title: "Configurações do sistema",  visivelPara: ["admin", "funcionario"] },
  { id: "admin",         label: "ADMIN",                  icone: "/icones/indicadores.png", title: "Painel administrativo",     visivelPara: ["admin"] },
  { id: "relatorio-admin", label: "RELATÓRIOS",           icone: "/icones/relatorios.png",  title: "Relatórios administrativos",visivelPara: ["admin"] },
];

// Normaliza o tipo vindo do token para um dos aceitos
function normalizaTipoUsuario(decoded) {
  const raw =
    decoded?.perfil ??
    decoded?.tipo ??
    decoded?.role ??
    decoded?.userType ??
    decoded?.user_role ??
    "";

  const t = String(raw).toLowerCase();

  if (t.includes("adm")) return "admin";
  if (["func", "funcionario", "user", "usuario", "worker", "colaborador"].includes(t))
    return "funcionario";

  return "funcionario"; // fallback seguro
}

export default function NavegacaoPrincipal() {
  const navigate = useNavigate();
  const location = useLocation();
  const abaAtiva = location.pathname.split("/")[1] || "inicio";

  // Descobre o tipo do usuário com fallback
  let tipoUsuario = "funcionario";
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      tipoUsuario = normalizaTipoUsuario(decoded);
      if (import.meta.env.DEV) {
        console.log("🧩 Token decodificado:", decoded);
        console.log("🧭 tipoUsuario normalizado:", tipoUsuario);
      }
    } catch (err) {
      console.warn("⚠️ Token inválido, usando 'funcionario' como padrão.");
    }
  } else {
    console.warn("⚠️ Nenhum token encontrado no localStorage (usando 'funcionario').");
  }

  // Filtra abas pelo tipo; se ficar vazio, usa o conjunto padrão do funcionário
  let abas = ABAS_BASE.filter((aba) => aba.visivelPara.includes(tipoUsuario));
  if (!abas.length) {
    abas = ABAS_BASE.filter((aba) => aba.visivelPara.includes("funcionario"));
  }

  useEffect(() => {
    window.dispatchEvent(new Event("dadosUsuarioAtualizados"));
  }, [abaAtiva]);

  // Tamanho base fixo para os ícones (sem contexto)
  const sizeBase = 65;

  return (
    <div
      className="shadow-inner w-full"
      style={{
        backgroundColor: "#1c3586",
        padding: "12px 8px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div className="relative max-w-[1600px] mx-auto">
        {/* Botão Sair */}
        <div style={{ position: "absolute", top: -2, right: -2 }}>
          <button
            onClick={() => navigate("/logout")}
            title="Sair do sistema"
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              transition: "background-color 0.2s ease, opacity 0.2s ease",
              opacity: 1,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#b91c1c";
              e.currentTarget.style.opacity = 0.9;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
              e.currentTarget.style.opacity = 1;
            }}
          >
            Sair
          </button>
        </div>

        {/* Abas */}
        <nav
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {abas.map((aba) => {
            const isAtiva = abaAtiva === aba.id;
            const size = isAtiva ? sizeBase + 15 : sizeBase;

            return (
              <div
                key={aba.id}
                data-id={aba.id}
                onClick={() => navigate(`/${aba.id}`)}
                title={aba.title}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "100px",
                  flexShrink: 0,
                  cursor: "pointer",
                  borderRadius: "14px",
                  padding: "10px 6px",
                  textAlign: "center",
                  backgroundColor: isAtiva ? "white" : "transparent",
                  boxShadow: isAtiva ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <img
                  alt={aba.label}
                  src={aba.icone}
                  onError={(e) => (e.currentTarget.src = "/icones/padrao.png")}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    objectFit: "contain",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
                <span
                  style={{
                    marginTop: "8px",
                    fontSize: "15px",
                    fontWeight: isAtiva ? 700 : 600,
                    color: isAtiva ? "#000" : "#fff",
                    textAlign: "center",
                  }}
                >
                  {aba.label}
                </span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
