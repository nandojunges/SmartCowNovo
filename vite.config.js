// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173, // opcional; pode remover se não precisar fixar
    proxy: {
      "/api": {
        // ⚠️ ajuste para a porta em que seu backend está rodando
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
