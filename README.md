# Gestao Leiteira

## Docs úteis
- docs/status/STATUS-pos-fase3.md
- docs/api/openapi-v1.yaml
- docs/curl/animais-smoke.sh e docs/curl/repro-smoke.sh
- docs/checklists/GO-NOGO.md

## Como rodar (quando o build estiver destravado)
- Passo 1: preencher `.env` na raiz (DB_*, EMAIL_*, PORT=3001).
- Passo 2: iniciar **só o backend**:
  ```
  cd backend
  npm i
  npm run db:init
  npm run dev  # ou npm start
  ```
- Passo 3: iniciar o **frontend**:
  ```
  npm i
  npm run dev
  ```
- Passo 4: start único (front+back):
  ```
  npm run start:all
  ```

