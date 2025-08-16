// backend/utils/_smtp_check.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { verificarSMTP } = require('./email');

(async () => {
  console.log('🔎 Testando SMTP com:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.EMAIL_REMETENTE,
    senha_len: process.env.EMAIL_SENHA_APP ? process.env.EMAIL_SENHA_APP.length : 0,
  });

  const r = await verificarSMTP();
  if (r.ok) {
    console.log('✅ SMTP OK: autenticação e conexão válidas.');
    process.exit(0);
  } else {
    console.error('❌ SMTP ERRO:', r.error?.message || r.error);
    // mostra causa raiz quando existir
    if (r.error && r.error.response) console.error('[response]', r.error.response);
    process.exit(2);
  }
})();