function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj || obj[f] === undefined || obj[f] === null || obj[f] === '');
  return { ok: missing.length === 0, missing };
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isDate(str) {
  return !isNaN(Date.parse(str));
}

module.exports = { requireFields, isEmail, isDate };
