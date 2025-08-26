// src/pages/Animais/CadastroAnimal.jsx
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { AbrirFichaTouro, ImportarFichaTouro } from "./FichasTouros";
import { criarAnimal, createSire, uploadSirePdf, getSirePdf } from "../../api"; // 🔗 chama POST /api/v1/animals

/* ===========================================
   Helpers inline (sem dependências externas)
=========================================== */

// dd/mm/aaaa com barra automática e validação básica
function formatarDataDigitada(valor) {
  const s = valor.replace(/\D/g, "").slice(0, 8);
  const dia = s.slice(0, 2);
  const mes = s.slice(2, 4);
  const ano = s.slice(4, 8);
  let out = [dia, mes, ano].filter(Boolean).join("/");
  if (out.length === 10) {
    const [d, m, a] = out.split("/").map(Number);
    const dt = new Date(a, (m || 1) - 1, d || 1);
    if (dt.getDate() !== d || dt.getMonth() !== (m - 1) || dt.getFullYear() !== a) {
      out = ""; // inválida
    }
  }
  return out;
}

function calcularIdadeECategoria(nascimento, sexo) {
  if (!nascimento || nascimento.length !== 10) return { idade: "", categoria: "" };
  const [dia, mes, ano] = nascimento.split("/").map(Number);
  const nascDate = new Date(ano, mes - 1, dia);
  if (isNaN(+nascDate)) return { idade: "", categoria: "" };
  const diffMs = Date.now() - nascDate.getTime();
  const meses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const idade = `${Math.floor(meses / 12)}a ${meses % 12}m`;

  let categoria = "";
  if (meses < 2) categoria = "Bezerro(a)";
  else if (meses < 12) categoria = "Novilho(a)";
  else if (meses < 24) categoria = sexo === "macho" ? "Touro jovem" : "Novilha";
  else categoria = sexo === "macho" ? "Touro" : "Adulto(a)";

  return { idade, categoria };
}

// máscara de moeda PT-BR
function maskMoedaBR(v) {
  let n = String(v).replace(/\D/g, "");
  n = (parseInt(n || "0", 10) / 100).toFixed(2);
  return n.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* ==========================================================
   Modal de Ficha Complementar (local, sem storage)
========================================================== */
function FichaComplementarAnimal({ numeroAnimal, onFechar, onSalvar, onSalvarTouro, touros = [] }) {
  const [nomeTouro, setNomeTouro] = useState("");
  const [sireId, setSireId] = useState(null);
  const [nomeMae, setNomeMae] = useState("");
  const [ultimaIA, setUltimaIA] = useState("");
  const [ultimoParto, setUltimoParto] = useState("");
  const [nLactacoes, setNLactacoes] = useState("");
  const [historico, setHistorico] = useState([]);
  const [modalTipo, setModalTipo] = useState(null);
  const [dataModal, setDataModal] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [modalVerFicha, setModalVerFicha] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [fichaParaVer, setFichaParaVer] = useState(null);

  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  // lista de touros é fornecida externamente (props ou global)

  const handleKey = (e, index) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
  };

  const salvarCompleta = async () => {
    const dataInvalida = (txt) => {
      if (!txt) return false; // campo opcional
      if (txt.length !== 10) return true;
      const [d, m, a] = txt.split("/").map(Number);
      const data = new Date(a, m - 1, d);
      return data.getDate() !== d || data.getMonth() !== m - 1 || data.getFullYear() !== a;
    };

    if (dataInvalida(ultimaIA) || dataInvalida(ultimoParto) || historico.some((h) => dataInvalida(h.data))) {
      alert("⚠️ Preencha as datas corretamente no formato dd/mm/aaaa.");
      return;
    }

    let dataPrevistaParto = "";
    if (ultimaIA?.length === 10) {
      const [dia, mes, ano] = ultimaIA.split("/");
      const dataIA = new Date(ano, mes - 1, dia);
      dataIA.setDate(dataIA.getDate() + 280);
      dataPrevistaParto = dataIA.toLocaleDateString("pt-BR");
    }

    const dados = {
      pai: nomeTouro || "",
      pai_id: sireId || "",
      mae: nomeMae || "",
      ultimaIA,
      ultimoParto,
      dataPrevistaParto,
      nLactacoes: parseInt(nLactacoes || 0, 10),
      historico: {
        inseminacoes: historico
          .filter((h) => h.tipo === "IA")
          .map((h) => ({ data: h.data, touro: nomeTouro || "—", inseminador: "—", tipo: "IA" })),
        partos: historico.filter((h) => h.tipo === "Parto").map((h) => ({ data: h.data, tipo: "Parto", obs: "—" })),
        secagens: historico.filter((h) => h.tipo === "Secagem").map((h) => ({ data: h.data, tipo: "Secagem", obs: "—" })),
      },
    };

    onSalvar?.(dados);
    setMensagemSucesso("✅ Ficha complementar salva com sucesso!");
    setTimeout(() => {
      setMensagemSucesso("");
      onFechar?.();
    }, 1200);
  };

  const adicionarEvento = () => {
    if (!dataModal || !modalTipo) return;
    const [d, m, a] = dataModal.split("/").map(Number);
    const data = new Date(a, m - 1, d);
    if (data.getDate() !== d || data.getMonth() !== m - 1 || data.getFullYear() !== a) return;
    const novo = { tipo: modalTipo, data: dataModal };
    const atualizado = [...historico, novo].sort((A, B) => {
      const [da, ma, ya] = A.data.split("/").map(Number);
      const [db, mb, yb] = B.data.split("/").map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
    setHistorico(atualizado);
    setDataModal("");
    setModalTipo(null);
  };

  async function abrirFichaDoTouro() {
    // pega o touro selecionado a partir do nome digitado no Select
    const t = (touros || []).find((x) => x.nome === nomeTouro);
    if (!t) {
      alert("Selecione um touro primeiro.");
      return;
    }

    // se já temos base64 em memória (antigo fluxo), usa direto
    if (t.arquivoBase64) {
      setFichaParaVer({
        ...t,
        arquivoBase64: t.arquivoBase64,
      });
      setModalVerFicha(true);
      return;
    }

    // novo fluxo: buscar do backend pelo ID salvo quando importou
    if (!t.id) {
      alert("Este touro não possui PDF vinculado ainda.");
      return;
    }

    try {
      const blob = await getSirePdf(t.id); // 404 aqui = PDF não foi salvo para esse ID
      const url = URL.createObjectURL(blob);
      setFichaParaVer({
        ...t,
        arquivoBase64: url, // AbrirFichaTouro usa este campo
      });
      setModalVerFicha(true);
    } catch (err) {
      console.error("Falha ao obter PDF do touro:", err);
      alert("Não encontrei o PDF deste touro no servidor.");
    }
  }

  const opcoesTouros = (touros || []).map((t) => ({ value: t.id, label: t.nome }));

  return (
    <div style={{ padding: '2rem' }}>
      {mensagemSucesso && <div style={alertSucesso}>✅ {mensagemSucesso}</div>}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>📋 Ficha Complementar</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <CreatableSelect
            isClearable
            options={opcoesTouros}
            value={
              opcoesTouros.find((opt) => opt.value === sireId)
              || (nomeTouro ? { value: "__temp__", label: nomeTouro } : null)
            }
            // 🔹 espelha o que for digitado no estado (mesmo sem ENTER)
            onInputChange={(val) => setNomeTouro((val || "").trim())}
            onChange={(opt) => {
              if (!opt) { setSireId(null); setNomeTouro(""); return; }
              setSireId(opt.value === "__temp__" ? null : opt.value);
              setNomeTouro(opt.label || "");
            }}
            placeholder="Selecione ou digite um touro e pressione ENTER"
          />
        </div>
        <button title="Ver ficha do touro" style={botaoIcone} onClick={abrirFichaDoTouro}>📄</button>
        <button
          type="button"
          title="Anexar Ficha"
          style={botaoAnexar}
          onClick={() => setModalImportar(true)}
        >
          <span style={{ fontSize: '1.25rem' }}>📎</span> Anexar Ficha
        </button>
      </div>

      <div style={grid2}>
        <div>
          <label>Nome da Mãe</label>
          <input
            ref={(el) => (refs.current[1] = el)}
            type="text"
            value={nomeMae}
            onChange={(e) => setNomeMae(e.target.value)}
            onKeyDown={(e) => handleKey(e, 1)}
            style={inputBase}
          />
        </div>
        <div>
          <label>Último Parto</label>
          <input
            ref={(el) => (refs.current[2] = el)}
            type="text"
            placeholder="dd/mm/aaaa"
            value={ultimoParto}
            onChange={(e) => setUltimoParto(formatarDataDigitada(e.target.value))}
            onKeyDown={(e) => handleKey(e, 2)}
            style={inputBase}
          />
        </div>
        <div>
          <label>Última IA</label>
          <input
            ref={(el) => (refs.current[3] = el)}
            type="text"
            placeholder="dd/mm/aaaa"
            value={ultimaIA}
            onChange={(e) => setUltimaIA(formatarDataDigitada(e.target.value))}
            onKeyDown={(e) => handleKey(e, 3)}
            style={inputBase}
          />
        </div>
        <div>
          <label>Número de lactações</label>
          <input
            ref={(el) => (refs.current[4] = el)}
            type="number"
            min="0"
            value={nLactacoes}
            onChange={(e) => setNLactacoes(e.target.value)}
            onKeyDown={(e) => handleKey(e, 4)}
            style={inputBase}
          />
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Histórico Reprodutivo</h4>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => setModalTipo("IA")} style={botaoAcao}>➕ Adicionar IA anterior</button>
          <button onClick={() => setModalTipo("Parto")} style={botaoAcao}>➕ Adicionar Parto anterior</button>
          <button onClick={() => setModalTipo("Secagem")} style={botaoAcao}>➕ Adicionar Secagem anterior</button>
        </div>

        {modalTipo && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              ref={(el) => (refs.current[5] = el)}
              type="text"
              value={dataModal}
              placeholder="dd/mm/aaaa"
              onChange={(e) => setDataModal(formatarDataDigitada(e.target.value))}
              onKeyDown={(e) => handleKey(e, 5)}
              style={inputBase}
            />
            <button ref={(el) => (refs.current[6] = el)} onClick={adicionarEvento} style={botaoPrincipal}>Salvar {modalTipo}</button>
          </div>
        )}

        <ul style={{ paddingLeft: '1rem', color: '#374151' }}>
          {historico.map((h, i) => (
            <li key={i}>📌 {h.tipo} em {h.data}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
        <button onClick={salvarCompleta} style={botaoPrincipal}>💾 Salvar Tudo</button>
        <button onClick={onFechar} style={botaoCancelar}>✖ Cancelar Ficha Complementar</button>
      </div>

      {modalVerFicha && (
        <AbrirFichaTouro
          ficha={fichaParaVer}
          onFechar={() => {
            setModalVerFicha(false);
            if (fichaParaVer?.arquivoBase64?.startsWith("blob:")) {
              URL.revokeObjectURL(fichaParaVer.arquivoBase64);
            }
            setFichaParaVer(null);
          }}
          onSalvar={(atualizado) => {
            onSalvarTouro?.(atualizado, nomeTouro);
            setNomeTouro(atualizado?.nome || nomeTouro);
          }}
        />
      )}
      {modalImportar && (
        <ImportarFichaTouro
          onFechar={() => setModalImportar(false)}
          onSalvar={async ({ nome, file }) => {
            try {
              const novo = await createSire(nome); // => { id, name, ... }
              await uploadSirePdf(novo.id, file);
              onSalvarTouro?.({ id: novo.id, nome, hasPdf: true });
              setSireId(novo.id);
              setNomeTouro(nome);
              setModalImportar(false);
            } catch (e) {
              console.error("Falha ao anexar a ficha do touro:", e);
              alert("Falha ao anexar a ficha do touro.");
            }
          }}
        />
      )}
    </div>
  );
}

/* =========================================
   Formulário principal de cadastro (único)
========================================= */
export default function CadastroAnimal({ animais = [], onAtualizar }) {

  const [numero, setNumero] = useState("");
  const [brinco, setBrinco] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [origem, setOrigem] = useState("propriedade");
  const [valorCompra, setValorCompra] = useState("");
  const [raca, setRaca] = useState("");
  const [novaRaca, setNovaRaca] = useState("");
  const [racasAdicionais, setRacasAdicionais] = useState([]);
  const [mostrarCampoNovaRaca, setMostrarCampoNovaRaca] = useState(false);
  const [mostrarComplementar, setMostrarComplementar] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [idade, setIdade] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [touros, setTouros] = useState([]);

  const brincoRef = useRef();
  const nascimentoRef = useRef();
  const salvarRef = useRef();
  const refs = [brincoRef, nascimentoRef, salvarRef];

  useEffect(() => {
    // gera número automaticamente com base no maior já salvo recebido por props
    const maiorNumero = animais.reduce((max, a) => Math.max(max, parseInt(a?.numero || 0, 10)), 0);
    setNumero(String(maiorNumero + 1));
  }, [animais]);

  useEffect(() => { brincoRef.current?.focus(); }, []);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setMostrarComplementar(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  // Atualiza idade/categoria conforme data/sexo
  useEffect(() => {
    const { idade: id, categoria: cat } = calcularIdadeECategoria(nascimento, sexo);
    setIdade(id); setCategoria(cat);
  }, [nascimento, sexo]);

  const adicionarNovaRaca = () => {
    const v = (novaRaca || "").trim();
    if (!v) return;
    if (racasAdicionais.includes(v)) { setRaca(v); setNovaRaca(""); setMostrarCampoNovaRaca(false); return; }
    const atualizadas = [...racasAdicionais, v];
    setRacasAdicionais(atualizadas);
    setRaca(v);
    setNovaRaca("");
    setMostrarCampoNovaRaca(false);
  };

  const handleSalvarTouro = (t, nomeAntigo) => {
    setTouros((prev) => {
      const lista = prev.filter((x) => x.nome !== (nomeAntigo || t.nome));
      return [...lista, t];
    });
  };

  const salvarAnimal = async (complementares = {}) => {
    if (!brinco || !nascimento || !raca || !sexo) {
      alert("⚠️ Preencha Brinco, Nascimento, Sexo e Raça.");
      return;
    }

    try {
      setSalvando(true);

      // 🔗 Persistência real no Postgres (enviar apenas campos do schema do backend)
      const payload = {
        numero,
        brinco,
        nascimento,                       // TEXT dd/mm/aaaa
        raca,
        estado: categoria || "vazia",     // mantém compatibilidade com tabela
        sexo,                             // 'femea' | 'macho'
        categoria,                        // salva o rótulo mostrado
        pai: complementares?.pai || "",
        pai_id: complementares?.pai_id || "",
        mae: complementares?.mae || "",
        n_lactacoes: Number(complementares?.nLactacoes || 0),
        ultima_ia: complementares?.ultimaIA || "",
        parto: complementares?.ultimoParto || "",
        previsao_parto: complementares?.dataPrevistaParto || "",
        historico: complementares?.historico || null, // opcional
      };
      const inserido = await criarAnimal(payload); // POST /api/v1/animals

      onAtualizar?.([...(animais || []), inserido]);

      setMensagemSucesso("✅ Animal cadastrado com sucesso!");
      setMensagemErro("");

      // limpa campos
      setBrinco(""); setNascimento(""); setSexo(""); setOrigem("propriedade");
      setValorCompra(""); setRaca(""); setNovaRaca(""); setIdade(""); setCategoria("");
      setMostrarCampoNovaRaca(false); setMostrarComplementar(false);

      // próximo número
      setNumero(String(parseInt(numero || "0", 10) + 1));
      setTimeout(() => setMensagemSucesso(""), 2500);
    } catch (err) {
      console.error("Erro ao salvar animal:", err);
      setMensagemErro("❌ Erro no cadastro. Tente novamente.");
      setTimeout(() => setMensagemErro(""), 3000);
    } finally {
      setSalvando(false);
    }
  };

  const handleEnter = (e, index) => {
    if (e.key === "Enter") {
      const next = refs[index + 1];
      if (next?.current) next.current.focus();
    }
  };

  const sexoOptions = [
    { value: "femea", label: "Fêmea" },
    { value: "macho", label: "Macho" },
  ];

  const racaOptions = [
    { value: "Holandês", label: "Holandês" },
    { value: "Jersey", label: "Jersey" },
    { value: "Girolando", label: "Girolando" },
    ...racasAdicionais.map((r) => ({ value: r, label: r })),
  ];

  const origemOptions = [
    { value: "propriedade", label: "Nascido na propriedade" },
    { value: "comprado", label: "Comprado" },
    { value: "doacao", label: "Doação" },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Poppins, sans-serif', padding: '0 1rem 1rem', marginTop: '-1rem' }}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        {mensagemSucesso && <div style={alertSucesso}>✅ {mensagemSucesso}</div>}
        {mensagemErro && <div style={alertErro}>❌ {mensagemErro}</div>}

        <div style={grid2}>
          <div>
            <label style={{ fontWeight: '600' }}>Número</label>
            <input type="text" value={numero} readOnly style={inputReadOnly} />
          </div>
          <div>
            <label style={{ fontWeight: '600' }}>Brinco</label>
            <input
              type="text"
              value={brinco}
              ref={brincoRef}
              onChange={(e) => setBrinco(e.target.value)}
              onKeyDown={(e) => handleEnter(e, 0)}
              style={inputBase}
              placeholder="Digite o brinco"
            />
          </div>
        </div>

        <div style={{ ...grid2, marginTop: '2rem' }}>
          <div>
            <label style={{ fontWeight: '600' }}>Nascimento</label>
            <input
              type="text"
              value={nascimento}
              ref={nascimentoRef}
              onChange={(e) => setNascimento(formatarDataDigitada(e.target.value))}
              onKeyDown={(e) => handleEnter(e, 1)}
              placeholder="dd/mm/aaaa"
              style={inputBase}
            />
          </div>
          <div>
            <label style={{ fontWeight: '600' }}>Sexo</label>
            <Select
              options={sexoOptions}
              value={sexoOptions.find((opt) => opt.value === sexo) || null}
              onChange={(e) => setSexo(e.value)}
              placeholder="Selecione"
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <label style={{ fontWeight: '600' }}>Origem</label>
          <Select
            options={origemOptions}
            value={origemOptions.find((opt) => opt.value === origem) || null}
            onChange={(e) => setOrigem(e.value)}
            placeholder="Selecione"
          />
          {origem === "comprado" && (
            <div style={{ marginTop: '1rem' }}>
              <label>Valor da compra (R$)</label>
              <input
                type="text"
                value={valorCompra}
                onChange={(e) => setValorCompra(maskMoedaBR(e.target.value))}
                style={{ ...inputBase, width: '60%' }}
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
          <div><strong>Categoria:</strong> {categoria || "—"}</div>
          <div><strong>Idade estimada:</strong> {idade || "—"}</div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <label style={{ fontWeight: '600' }}>Raça</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Select
              options={racaOptions}
              value={racaOptions.find((opt) => opt.value === raca) || null}
              onChange={(e) => setRaca(e.value)}
              placeholder="Selecione"
              styles={{ container: (base) => ({ ...base, flex: 1 }) }}
            />
            <button
              onClick={() => setMostrarCampoNovaRaca(!mostrarCampoNovaRaca)}
              title="Adicionar nova raça"
              style={botaoVerde()}
            >
              ＋
            </button>
          </div>
          {mostrarCampoNovaRaca && (
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={novaRaca}
                onChange={(e) => setNovaRaca(e.target.value)}
                placeholder="Digite nova raça"
                style={{ ...inputBase, flex: 1 }}
              />
              <button onClick={adicionarNovaRaca} style={botaoVerde(true)}>Adicionar</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
          {!mostrarComplementar && (
            <button onClick={() => salvarAnimal()} disabled={salvando} ref={salvarRef} style={botaoPrincipal}>
              💾 Cadastrar Animal
            </button>
          )}
          <button onClick={() => setMostrarComplementar(true)} style={botaoSecundario}>
            ➕ Completar Ficha
          </button>
        </div>
      </div>

      {mostrarComplementar && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarComplementar(false); }}
        >
          <div style={{ background: "#fff", width: "min(900px, 92vw)", borderRadius: 16 }}>
            <FichaComplementarAnimal
              numeroAnimal={numero}
              onSalvar={(dados) => salvarAnimal(dados)}
              onFechar={() => setMostrarComplementar(false)}
              touros={touros}
              onSalvarTouro={handleSalvarTouro}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =================
   Estilos inline
================= */
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' };

const inputBase = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
  backgroundColor: '#fff',
};

const inputReadOnly = { ...inputBase, backgroundColor: '#f1f5f9' };

const botaoPrincipal = {
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '0.75rem 2rem',
  borderRadius: '0.5rem',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer',
};

const botaoSecundario = {
  backgroundColor: '#e0e7ff',
  color: '#1e3a8a',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: '1px solid #c7d2fe',
  fontWeight: '500',
  cursor: 'pointer',
};

const botaoVerde = (compacto = false) => ({
  backgroundColor: '#10b981',
  color: '#fff',
  padding: compacto ? '0.6rem 1.2rem' : '0 1rem',
  borderRadius: '0.5rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: 'none',
});

const botaoAcao = {
  backgroundColor: '#f3f4f6',
  color: '#111827',
  padding: '0.6rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
  fontWeight: '500',
  cursor: 'pointer',
};

const botaoAnexar = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: '600',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
};

const botaoIcone = {
  backgroundColor: '#f3f4f6',
  color: '#111827',
  padding: '0.6rem',
  borderRadius: '0.5rem',
  border: '1px solid #cbd5e1',
  fontSize: '1.1rem',
  fontWeight: '500',
  cursor: 'pointer',
};

const botaoCancelar = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  padding: '0.75rem 2rem',
  borderRadius: '0.5rem',
  border: '1px solid #fecaca',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const alertSucesso = {
  backgroundColor: '#ecfdf5',
  color: '#065f46',
  border: '1px solid #34d399',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  marginBottom: '1.5rem',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const alertErro = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #fca5a5',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  marginBottom: '1.5rem',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
