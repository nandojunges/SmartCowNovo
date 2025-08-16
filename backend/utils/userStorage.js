const fs = require('fs');
const path = require('path');

function sanitizeEmail(email) {
  return String(email || '').toLowerCase().replace(/[@.]/g, '_');
}

function getUserDir(email) {
  return path.join(__dirname, '..', 'data', sanitizeEmail(email));
}

function ensureUserDir(email) {
  const dir = getUserDir(email);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { getUserDir, ensureUserDir, sanitizeEmail };