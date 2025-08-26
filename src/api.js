// src/api.js
import axios from 'axios';

// 👉 baseURL vazia para não duplicar /api
const api = axios.create({
  baseURL: '',
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
      // window.location.href = '/login'; // opcional
    }
    return Promise.reject(err);
  }
);

// ✅ helper que sempre prefixa com /api
const API = '/api';
const path = (s = '') => {
  const seg = s.startsWith('/') ? s : `/${s}`;
  return `${API}${seg}`;
};

export default api;

/* ================== ANIMAIS ================== */
export async function getAnimais({ estado, q, page, limit } = {}) {
  const params = {};
  if (estado) params.estado = estado;
  if (q) params.q = q;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const res = await api.get(path('/animais'), { params });
  return res.data;
}

export async function getAnimal(id) {
  const res = await api.get(path(`/animais/${id}`));
  return res.data;
}

export async function criarAnimal(data) {
  const res = await api.post(path('/animais'), data);
  return res.data;
}

export async function atualizarAnimal(id, data) {
  const res = await api.put(path(`/animais/${id}`), data);
  return res.data;
}

export async function removerAnimal(id) {
  const res = await api.delete(path(`/animais/${id}`));
  return res.data;
}

/* ================== REPRODUÇÃO ================== */
export async function inserirInseminacao(id, data) {
  const res = await api.post(path(`/reproducao/${id}/inseminacoes`), data);
  return res.data;
}

export async function inserirDiagnostico(id, data) {
  const res = await api.post(path(`/reproducao/${id}/diagnosticos`), data);
  return res.data;
}

export async function registrarParto(id, data) {
  const res = await api.post(path(`/reproducao/${id}/partos`), data);
  return res.data;
}

export async function registrarSecagem(id, data) {
  const res = await api.post(path(`/reproducao/${id}/secagens`), data);
  return res.data;
}

export async function listarHistoricoReproducao(id) {
  const res = await api.get(path(`/reproducao/${id}/historico`));
  return res.data;
}

/* ================== SAÚDE ================== */
export async function listarHistoricoSaude(id) {
  const res = await api.get(path(`/saude/${id}/historico`));
  return res.data;
}

export async function registrarOcorrencia(id, data) {
  const res = await api.post(path(`/saude/${id}/ocorrencias`), data);
  return res.data;
}

export async function registrarTratamento(id, data) {
  const res = await api.post(path(`/saude/${id}/tratamentos`), data);
  return res.data;
}

/* ================== CONFIGURAÇÃO DO USUÁRIO ================== */
export async function carregarConfiguracao() {
  const res = await api.get(path('/configuracao'));
  return res.data;
}

export async function salvarConfiguracao(data) {
  const res = await api.post(path('/configuracao'), data);
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
  api.post(path('/animais/saidas'), saida).then((r) => r.data);

/* ================== MANUTENÇÃO ================== */
export async function promoverPreParto() {
  const res = await api.post(path('/maintenance/promote-preparto'));
  return res.data;
}

export async function ping() {
  const res = await api.get(path('/health'));
  return res.data;
}
