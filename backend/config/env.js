const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '..', '.env') });
const cfg = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'gestao_leiteira',
  },
  port: +(process.env.PORT || 3001),
  mail: {
    service: process.env.EMAIL_SERVICE || 'Zoho',
    user: process.env.EMAIL_REMETENTE,
    pass: process.env.SENHA_REMETENTE,
    from: process.env.MAIL_FROM || process.env.EMAIL_REMETENTE,
  },
  jwtSecret: process.env.JWT_SECRET || 'change_me',
};
module.exports = cfg;
