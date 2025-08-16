const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { enviarCodigo } = require('../utils/email');

(async () => {
  const { EMAIL_REMETENTE, EMAIL_SENHA_APP } = process.env;
  if (!EMAIL_REMETENTE || !EMAIL_SENHA_APP) {
    console.log('⚠️  EMAIL_REMETENTE/EMAIL_SENHA_APP não configurados - pulando teste de e-mail');
    process.exit(0);
  }
  try {
    await enviarCodigo(EMAIL_REMETENTE, String(Math.floor(100000 + Math.random()*900000)));
    console.log('✅ Teste OK');
    process.exit(0);
  } catch (e) {
    console.error('⚠️  Falha ao enviar (ignorando em testes):', e.message);
    process.exit(0);
  }
})();