// src/pages/Animais/FichasTouros.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../api";

/* ===============================
   📎 Importar Ficha do Touro (upload PDF)
   - Envia FormData e abre o PDF salvo
================================ */
export function ImportarFichaTouro({ onSucesso, onFechar }) {
  const [nome, setNome] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const nomeRef = useRef();
  const inputFileRef = useRef();

  useEffect(() => {
    nomeRef.current?.focus();
    const handle = (e) => {
      if (e.key === "Escape") onFechar?.();
      if (e.key === "Enter") salvarFicha();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarFicha() {
    if (!nome.trim()) {
      alert("Informe o nome do touro.");
      return;
    }
    if (!arquivo) {
      alert("Selecione um arquivo PDF.");
      return;
    }

    try {
      setSalvando(true);
      const fd = new FormData();
      fd.append("name", nome.trim());
      fd.append("pdf", arquivo);
      const { data } = await api.post("/v1/sires", fd);
      onSucesso?.(data);
      window.open(`/api/v1/sires/${data.id}/pdf`, "_blank", "noopener");
      onFechar?.();
    } catch (err) {
      console.error("Falha ao anexar a ficha do touro:", err);
      alert(err?.response?.data?.message || "Não foi possível anexar a ficha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>📎 Anexar Ficha do Touro</h2>

        <div style={{ marginTop: '1rem' }}>
          <label>Nome do Touro</label>
          <input
            ref={nomeRef}
            type="text"
            placeholder="Ex.: WARLOCK DO ABC"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label>Selecione o arquivo PDF</label>
          <input
            ref={inputFileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
          <button disabled={salvando} onClick={salvarFicha} style={botaoPrincipal}>
            {salvando ? "Anexando..." : "💾 Anexar Ficha"}
          </button>
          <button onClick={onFechar} style={botaoCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   📄 Abrir/Editar Ficha do Touro (apenas memória)
================================ */
export function AbrirFichaTouro({ ficha, onFechar, onSalvar }) {
  const [dados, setDados] = useState(ficha || null);
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState(ficha || {});
  const inputRef = useRef();

  useEffect(() => {
    setDados(ficha || null);
    setValores(ficha || {});
  }, [ficha]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
    const esc = (e) => e.key === "Escape" && onFechar?.();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  if (!dados) {
    return (
      <div style={fundoEscuro}>
        <div style={modalBranco}>
          <p style={{ color: "#991b1b" }}>Nenhuma ficha encontrada para este touro.</p>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <button onClick={onFechar} style={botaoCancelar}>Fechar ✖</button>
          </div>
        </div>
      </div>
    );
  }

  const salvarEdicao = () => {
    setDados(valores);
    onSalvar?.(valores);
    setEditando(false);
  };

  const campo = (titulo, chave, placeholder = "-") => (
    <div>
      <strong>{titulo}: </strong>
      {editando ? (
        <input
          ref={!inputRef.current ? inputRef : undefined}
          value={valores[chave] || ""}
          onChange={(e) => setValores({ ...valores, [chave]: e.target.value })}
          style={inputInline}
        />
      ) : (
        <span>{dados[chave] || placeholder}</span>
      )}
    </div>
  );

  return (
    <div style={fundoEscuro}>
      <div style={modalBranco}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>📄 Ficha do Touro</h2>
          <button onClick={() => setEditando((v) => !v)} style={botaoEditar}>
            ✏️ {editando ? "Editando" : "Editar"}
          </button>
        </div>

        <div style={{ marginTop: "1.5rem", display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {campo("Nome", "nome")}
          {campo("Raça", "raca")}
          {campo("Registro", "registro")}
          {campo("Origem", "origem")}
          {campo("PTA Leite", "ptaLeite")}
          {campo("PTA Gordura", "ptaGordura")}
          {campo("PTA Proteína", "ptaProteina")}
          {campo("CCS", "ccs")}
          {campo("Fertilidade Filhas", "fertilidade")}
        </div>

        <h4 style={{ marginTop: "2rem", fontWeight: "bold" }}>📎 Visualização do PDF</h4>
        {dados.arquivoBase64 ? (
          <iframe
            title="Ficha do Touro (PDF)"
            src={dados.arquivoBase64}
            style={{ width: "100%", height: "500px", borderRadius: "0.5rem", marginTop: "0.5rem", border: "1px solid #e5e7eb" }}
          />
        ) : (
          <p style={{ color: "#991b1b" }}>Nenhuma ficha em PDF foi anexada.</p>
        )}

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          {editando && (
            <button onClick={salvarEdicao} style={botaoPrincipal}>Salvar ✅</button>
          )}
          <button onClick={onFechar} style={botaoCancelar}>{editando ? "Cancelar ✖" : "Fechar ✖"}</button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   🎨 Estilos compartilhados
================================ */
const overlayStyle = {
  position: 'fixed', top: 0, left: 0,
  width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '0.75rem',
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
};

const inputStyle = {
  width: '100%',
  marginTop: '0.3rem',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem'
};

const fundoEscuro = {
  position: "fixed", top: 0, left: 0,
  width: "100vw", height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 1000
};

const modalBranco = {
  background: "white",
  padding: "2rem",
  borderRadius: "0.75rem",
  width: "800px",
  maxHeight: "90vh",
  overflowY: "auto"
};

const inputInline = {
  padding: "0.4rem 0.6rem",
  marginLeft: "0.5rem",
  fontSize: "1rem",
  border: "1px solid #ccc",
  borderRadius: "0.4rem"
};

const botaoEditar = {
  backgroundColor: '#fef9c3',
  color: '#92400e',
  padding: '0.4rem 0.75rem',
  borderRadius: '0.5rem',
  fontWeight: '600',
  border: '1px solid #fde68a',
  cursor: 'pointer'
};

const botaoPrincipal = {
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 1.5rem',
  borderRadius: '0.5rem',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer'
};

const botaoCancelar = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  padding: '0.6rem 1.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #fecaca',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer'
};
