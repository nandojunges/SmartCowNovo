// src/api.js
import axios from 'axios';

// Use caminho absoluto no SDK (ex.: '/api/v1/...') e deixe a base vazia.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// injeta token (se houver)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// trata 401/403 de forma centralizada
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      // opcional: redirecionar para login
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// normaliza caminho (mantém como passado)
const p = (s) => s;

export default api;

/* ================== ANIMAIS ================== */
export async function getAnimais({ estado, q, page, limit } = {}) {
  const params = {};
  if (estado) params.estado = estado;
  if (q) params.q = q;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const res = await api.get(p('/animais'), { params });
  return res.data;
}

export async function getAnimal(id) {
  const res = await api.get(p(`/animais/${id}`));
  return res.data;
}

export async function criarAnimal(data) {
  const res = await api.post(p('/animais'), data);
  return res.data;
}

export async function atualizarAnimal(id, data) {
  const res = await api.put(p(`/animais/${id}`), data);
  return res.data;
}

export async function removerAnimal(id) {
  const res = await api.delete(p(`/animais/${id}`));
  return res.data;
}

/* ================== REPRODUÇÃO ================== */
export async function inserirInseminacao(id, data) {
  const res = await api.post(p(`/reproducao/${id}/inseminacoes`), data);
  return res.data;
}

export async function inserirDiagnostico(id, data) {
  const res = await api.post(p(`/reproducao/${id}/diagnosticos`), data);
  return res.data;
}

export async function registrarParto(id, data) {
  const res = await api.post(p(`/reproducao/${id}/partos`), data);
  return res.data;
}

export async function registrarSecagem(id, data) {
  const res = await api.post(p(`/reproducao/${id}/secagens`), data);
  return res.data;
}

export async function listarHistoricoReproducao(id) {
  const res = await api.get(p(`/reproducao/${id}/historico`));
  return res.data;
}

/* ================== SAÚDE ================== */
export async function listarHistoricoSaude(id) {
  const res = await api.get(p(`/saude/${id}/historico`));
  return res.data;
}

export async function registrarOcorrencia(id, data) {
  const res = await api.post(p(`/saude/${id}/ocorrencias`), data);
  return res.data;
}

export async function registrarTratamento(id, data) {
  const res = await api.post(p(`/saude/${id}/tratamentos`), data);
  return res.data;
}

/* ================== CONFIGURAÇÃO DO USUÁRIO ================== */
// 🔧 Antes você chamava '/api/configuracao' e tomava 404.
// Padronize para '/api//configuracao' (ou crie a rota no backend).
export async function carregarConfiguracao() {
  const res = await api.get(p('/configuracao'));
  return res.data;
}

export async function salvarConfiguracao(data) {
  const res = await api.post(p('/configuracao'), data);
  return res.data;
}

/* ======= COMPATIBILIDADE COM FUNÇÕES ANTIGAS (sqlite) ======= */
export const buscarTodosAnimais = getAnimais;
export const buscarAnimalPorId = getAnimal;
export const buscarAnimalPorNumero = (numero) =>
  getAnimais({ q: numero }).then((list) => list && list[0]);
export const salvarAnimais = async (animais) =>
  Promise.all((animais || []).map((a) => (a.id ? atualizarAnimal(a.id, a) : criarAnimal(a))));
export const atualizarAnimalNoBanco = (animal) => atualizarAnimal(animal.id, animal);
export const excluirAnimal = removerAnimal;
export const salvarSaidaAnimal = (saida) =>
  api.post(p('/animais/saidas'), saida).then((r) => r.data);

/* ================== MANUTENÇÃO ================== */
export async function promoverPreParto() {
  const res = await api.post(p('/maintenance/promote-preparto'));
  return res.data;
}

export async function ping() {
  const res = await api.get(p('/health'));
  return res.data;
}
