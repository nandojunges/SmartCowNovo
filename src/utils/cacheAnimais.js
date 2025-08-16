import api from '../api';

let cache = null;
let fetching = null;

export async function buscarAnimaisComCache() {
  if (cache) return cache;
  if (!fetching) {
    fetching = api.get('/animais').then((res) => {
      cache = res.data;
      fetching = null;
      return cache;
    });
  }
  return fetching;
}

export function limparCacheAnimais() {
  cache = null;
  fetching = null;
}
