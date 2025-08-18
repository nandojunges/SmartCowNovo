# Lembrete rápido (dev)
- Backend: `cd backend && npm i && npm run db:init && npm run dev`
- Frontend: `npm i && npm run dev` (quando o build destravar)
- Start único: `npm run start:all`
- Health:
  - API: GET http://localhost:3001/api/v1/health
  - DB:  GET http://localhost:3001/api/v1/health/db
- Smoke (sem front):
  - `docs/curl/animais-smoke-backend.sh`
  - `docs/curl/auth-smoke.sh`

  Restauração: pegue o arquivo .sql.gz do dia anterior e rode:

bash
Copiar
Editar
gunzip -c backups/tenants/<schema>/<data>/<arquivo>.sql.gz | psql -h $PGHOST -U $PGUSER -d $PGDATABASE
Pré-requisito: ter o pg_dump disponível (vem com a instalação do PostgreSQL).

npm run dev:all
