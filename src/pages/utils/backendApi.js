/**
 * Stub temporário: bloqueia hits em /api/* enquanto reestruturamos as abas.
 * Troque por sua implementação real quando for religar cada módulo.
 */
export async function request(path, options = {}) {
  try {
    // Protege contra imports legados chamando /api/*
    if (typeof path === "string" && path.startsWith("/api/")) {
      const method = (options.method || "GET").toUpperCase();
      console.warn(`🛑 API bloqueada em DEV: ${method} ${path}`);
      // Devolve payloads “seguros” para não quebrar UIs antigas
      if (method === "GET")  return { ok: true, data: [] };
      if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
        return { ok: true };
    }

    const resp = await fetch(path, options);
    if (!resp.ok) throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json") ? resp.json() : resp.text();
  } catch (err) {
    console.error("backendApi.request erro:", err);
    throw err;
  }
}

const api = { request };
export default api;