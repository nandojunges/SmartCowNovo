import { carregarConfiguracao as carregarConfigApi, salvarConfiguracao as salvarConfigApi } from '../api';

export async function salvarConfiguracao(config) {
  try {
    await salvarConfigApi(config);
  } catch {
    // ignore storage errors
  }
}

export async function carregarConfiguracao() {
  try {
     return await carregarConfigApi();
  } catch {
    return {};
  }
}
