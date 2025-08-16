import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import SistemaBase from "./layout/SistemaBase";

// Auth (ajuste os nomes/paths se os seus forem diferentes)
import Login from "./pages/Auth/Login.jsx";
import Cadastro from "./pages/Auth/Cadastro.jsx";
import EsqueciSenha from "./pages/Auth/EsqueciSenha.jsx";
import VerificarEmail from "./pages/Auth/VerificarEmail.jsx";
import Logout from "./pages/Auth/Logout.jsx";

// Páginas (placeholders “Em construção”)
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

// Guard mínimo (precisa ter token no localStorage)
function RequireAuth() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* públicas (login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/logout" element={<Logout />} />

        {/* protegidas (tudo atrás do token) */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<SistemaBase />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<Inicio />} />
            <Route path="animais" element={<Animais />} />
            <Route path="bezerras" element={<Bezerras />} />
            <Route path="reproducao" element={<Reproducao />} />
            <Route path="leite" element={<Leite />} />
            <Route path="saude" element={<Saude />} />
            {/* a aba no menu usa id "consumo"; o componente está em ConsumoReposicao */}
            <Route path="consumo" element={<ConsumoReposicao />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="ajustes" element={<Ajustes />} />

            {/* por enquanto, sem admin/relatórios-admin; adicionamos depois */}
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Route>
        </Route>

        {/* fallback global -> login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
