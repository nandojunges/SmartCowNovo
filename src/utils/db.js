export const db = {
  all: (_, __, cb) => cb(null, []),
  get: (_, __, cb) => cb(null, null),
  run: (_, __, cb) => cb && cb(null),
  serialize: (fn) => fn && fn()
};

const BASE_URL = '/api';

async function fetchJson(url, options) {
  try {
    const token = localStorage.getItem('token');
    options = options || {};
    options.headers = {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(url, options);
    const dados = await res.json();
    if (!Array.isArray(dados) && options?.method === undefined) {
      console.error('Dados inválidos');
      return [];
    }
    return dados;
  } catch {
    return null;
  }
}

export async function buscarTodos(chave) {
  const dados = await fetchJson(`${BASE_URL}/${chave}`);
  return Array.isArray(dados) ? dados : [];
}

export async function adicionarItem(chave, item) {
  return fetchJson(`${BASE_URL}/${chave}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}

export async function atualizarItem(chave, item) {
  return fetchJson(`${BASE_URL}/${chave}/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}

export async function removerItem(chave) {
  return fetchJson(`${BASE_URL}/${chave}`, { method: 'DELETE' });
}

