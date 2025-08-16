import { toast } from 'react-toastify';

export const baseURL = '/api';

export const db = {}; // reservado se quiser guardar dados em cache

const warned404 = new Set();

async function request(path, options = {}) {
  try {
    const token = localStorage.getItem('token');
    options.headers = {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(`${baseURL}${path}`, options);
    if (!res.ok) {
      if (res.status === 404) {
        if (process.env.NODE_ENV === 'development' && !warned404.has(path)) {
          warned404.add(path);
          console.warn(`⚠️ Recurso não encontrado: ${path}`);
        }
        return null;
      }
      throw new Error(`Erro ${res.status}: ${res.statusText}`);
    }
    const dados = await res.json();
    if (Array.isArray(dados) || typeof dados === 'object') {
      return dados;
    }
    console.error('Dados inválidos');
    return null;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erro ao buscar dados:', err.message);
    }
    toast.error('Erro ao conectar com o servidor.');
    return null;
  }
}

export async function buscarTodos(endpoint) {
  try {
    const res = await request(`/${endpoint}`);
    return Array.isArray(res) ? res : [];
  } catch (erro) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Erro ao buscar /${endpoint}:`, erro);
    }
    return [];
  }
}

export async function buscarPorId(collection, id) {
  const res = await request(`/${collection}/${id}`);
  return res || null;
}

export async function buscarPorNumero(collection, numero) {
  const res = await request(`/${collection}/numero/${numero}`);
  return res || null;
}

export async function adicionarItem(collection, item) {
  return request(`/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}

export async function atualizarItem(collection, item) {
  if (!item) throw new Error('Item deve conter um id');
  const identificador = item.id;
  if (identificador === undefined)
    throw new Error('Item deve conter um id');
  return request(`/${collection}/${identificador}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}

export async function excluirItem(collection, id) {
  return request(`/${collection}/${id}`, { method: 'DELETE' });
}

export async function enviarImagem(imagemFile) {
  const formData = new FormData();
  formData.append('file', imagemFile);
  const data = await request('/upload', { method: 'POST', body: formData });
  return data?.url;
}

export async function salvarConfiguracao(config) {
  return request('/configuracoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
}
