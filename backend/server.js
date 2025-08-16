const path = require('path');
// Carrega variáveis do backend/.env e, se existir, também do .env da raiz
require('dotenv').config(); // backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // fallback raiz
const express = require('express');
const cors = require('cors');
const cfg = require('./config/env');
const dbMiddleware = require('./middleware/dbMiddleware');
const fs = require('fs');
let morgan; try { morgan = require('morgan'); } catch {}

const vacasRoutes = require('./routes/vacasRoutes');
const animaisRouter = require('./routes/animais');
const tarefasRoutes = require('./routes/tarefasRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const protocolosRoutes = require('./routes/protocolosRoutes');
const reproducaoRoutes = require('./routes/reproducaoRoutes');
const tourosRoutes = require('./routes/tourosRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const bezerrasRoutes = require('./routes/bezerrasRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const examesRoutes = require('./routes/examesSanitariosRoutes');
const racasRoutes = require('./routes/racasRoutes');
const mockRoutes = require('./routes/mockRoutes');
const rotasExtras = require('./routes/rotasExtras');
const adminRoutes = require('./routes/adminRoutes');
const apiV1Routes = require('./routes/apiV1');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const healthRoutes = require('./routes/healthRoutes');
const healthDbRoutes = require('./routes/healthDbRoutes');
const logger = require('./middleware/logger');
const { initDB, getPool } = require('./db');

(async () => {
  await initDB('system@gestao'); // roda applyMigrations/abre pool
})();

const app = express();
app.use(cors());
// aumenta o limite de tamanho do JSON para aceitar PDFs codificados em Base64 (até 10 mb)
app.use(express.json({ limit: '10mb' }));
app.use(logger);
if (morgan) app.use(morgan('dev'));

// Logger focado só em /api/auth/*
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (!/^\/api\/auth(\/|$)/.test(req.originalUrl)) return;
    console.log(JSON.stringify({
      tag: 'AUTH',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start
    }));
  });
  next();
});

// Health check simples (útil para ver se o proxy está batendo mesmo)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Servir arquivos estáticos usados pelo front (rotativos .txt)
app.use('/api/data', express.static(path.join(__dirname, 'data')));

// 📁 Pasta para backups de dados excluídos
fs.mkdirSync(path.join(__dirname, 'dadosExcluidos'), { recursive: true });

// Importa middleware de autenticação para uso seletivo nas rotas protegidas
const authMiddleware = require('./middleware/authMiddleware');

// Em vez de aplicar autenticação e carregamento de banco globalmente (o que bloqueia
// o acesso a páginas públicas como a tela de login), aplicamos por rota:
// As rotas que exigem token e acesso ao banco recebem os middlewares na definição abaixo.

// 🌐 Rotas da API (prefixadas com /api para corresponder ao front-end)
// Rotas protegidas: authMiddleware e dbMiddleware são aplicados
app.use('/api/vacas', authMiddleware, dbMiddleware, vacasRoutes);
// Rota temporária para evitar erro 500 no dashboard
app.use('/api/animais', animaisRouter);
app.use('/api/tarefas', authMiddleware, dbMiddleware, tarefasRoutes);
app.use('/api/estoque', authMiddleware, dbMiddleware, estoqueRoutes);
app.use('/api/bezerras', authMiddleware, dbMiddleware, bezerrasRoutes);
app.use('/api/protocolos-reprodutivos', authMiddleware, dbMiddleware, protocolosRoutes);
app.use('/api/reproducao', authMiddleware, dbMiddleware, reproducaoRoutes);
app.use('/api/financeiro', authMiddleware, dbMiddleware, financeiroRoutes);
app.use('/api/eventos', authMiddleware, dbMiddleware, eventosRoutes);
app.use('/api/produtos', authMiddleware, dbMiddleware, produtosRoutes);
app.use('/api/examesSanitarios', authMiddleware, dbMiddleware, examesRoutes);
app.use('/api/racas', authMiddleware, dbMiddleware, racasRoutes);
// nova rota para fichas de touros (pai dos animais)
app.use('/api/touros', authMiddleware, dbMiddleware, tourosRoutes);
// mantendo também a rota sem prefixo para compatibilidade com alguns pontos do front-end
// Rotas não protegidas (mock e auth) não devem exigir token nem acessar banco
app.use('/', mockRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api', rotasExtras);
app.use('/api', adminRoutes);
// Rotas v1 com services reestruturados
app.use(apiV1Routes);
app.use(maintenanceRoutes);
app.use(healthRoutes);
app.use(healthDbRoutes);

// 🧾 Servir frontend estático (build do React)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ⛳ STUB temporário: não persistir config, só responder OK
app.post('/api/configuracao', (req, res) => {
  try {
    // console.log('🛠️ [STUB CONFIG] ignorando payload', req.body);
    return res.status(204).end();
  } catch (e) {
    return res.status(204).end();
  }
});

// Não deixe rotas /api/* caírem no SPA:
app.use('/api/data/rotativos', (req, res) => {
  return res.status(404).json({ error: 'Arquivo não encontrado (dev)' });
});

// Fallback do SPA protegido
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route não encontrada' });
  }
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  // Em dev (vite) não tem dist; evita ENOENT
  return res.status(200).send('<!doctype html><html><body><h1>Dev server ativo</h1></body></html>');
});

// Loga toda exceção não capturada em rotas
app.use((err, req, res, next) => {
  console.error('API ERROR:', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    error: err?.stack || err
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

// 🚀 Inicialização do servidor (somente se executado diretamente)
const PORT = cfg.port;

if (require.main === module) {
  const enablePrePartoJob = process.env.ENABLE_PREPARTO_JOB === 'true';
  if (enablePrePartoJob) {
    const schedulePrePartoJob = require('./jobs/preparto');
    schedulePrePartoJob();
  }
  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Porta ${PORT} já está em uso. Finalize o processo antigo ou aguarde a liberação da porta.`);
      process.exit(1);
    } else {
      console.error('❌ Erro ao iniciar servidor:', err);
      process.exit(1);
    }
  });
}

// Exporta para testes ou uso externo
module.exports = app;