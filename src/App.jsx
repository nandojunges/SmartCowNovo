import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import SistemaBase from "./layout/SistemaBase";

// Auth (páginas públicas)
import Login from "./pages/Auth/Login.jsx";
import Cadastro from "./pages/Auth/Cadastro.jsx";
import EsqueciSenha from "./pages/Auth/EsqueciSenha.jsx";
import VerificarEmail from "./pages/Auth/VerificarEmail.jsx";
import Logout from "./pages/Auth/Logout.jsx";
import EscolherPlano from "./pages/Auth/EscolherPlano.jsx"; // 👈 NOVO

// Placeholders (protegidas)
import Inicio from "./pages/Inicio/Inicio.jsx";
import Animais from "./pages/Animais/Animais.jsx";
import Bezerras from "./pages/Bezerras/Bezerras.jsx";
import Reproducao from "./pages/Reproducao/Reproducao.jsx";
import Leite from "./pages/Leite/Leite.jsx";
import Saude from "./pages/Saude/Saude.jsx";
import ConsumoReposicao from "./pages/ConsumoReposicao/ConsumoReposicao.jsx";
import Financeiro from "./pages/Financeiro/Financeiro.jsx";
import Calendario from "./pages/Calendario/Calendario.jsx";
import Ajustes from "./pages/Ajustes/Ajustes.jsx";

function RequireAuth() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

// Evita ver /login e /cadastro se já estiver logado (tira “piscar”)
function RedirectIfAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/inicio" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* públicas — fora do guard */}
        <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/escolher-plano" element={<RedirectIfAuth><EscolherPlano /></RedirectIfAuth>} /> {/* 👈 NOVA ROTA */}
        <Route path="/cadastro" element={<RedirectIfAuth><Cadastro /></RedirectIfAuth>} />
        <Route path="/esqueci-senha" element={<RedirectIfAuth><EsqueciSenha /></RedirectIfAuth>} />
        <Route path="/verificar-email" element={<RedirectIfAuth><VerificarEmail /></RedirectIfAuth>} />
        <Route path="/logout" element={<Logout />} />

        {/* protegidas */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<SistemaBase />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<Inicio />} />
            <Route path="animais" element={<Animais />} />
            <Route path="bezerras" element={<Bezerras />} />
            <Route path="reproducao" element={<Reproducao />} />
            <Route path="leite" element={<Leite />} />
            <Route path="saude" element={<Saude />} />
            <Route path="consumo" element={<ConsumoReposicao />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Route>
        </Route>

        {/* fallback global */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
