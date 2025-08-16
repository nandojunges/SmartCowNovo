const { resetTokens } = require('./tempTokens');

function setResetToken(email, userId, token, exp) {
  resetTokens.set(token, { email, userId, exp });
}

function getResetToken(token) {
  const data = resetTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.exp) {
    resetTokens.delete(token);
    return null;
  }
  return data;
}

function deleteResetToken(token) {
  resetTokens.delete(token);
}

module.exports = { setResetToken, getResetToken, deleteResetToken };
