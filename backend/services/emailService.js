const nodemailer = require('nodemailer');
const cfg = require('../config/env');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: cfg.mail.service,
    auth: { user: cfg.mail.user, pass: cfg.mail.pass }
  });
  return transporter;
}

async function sendMail(to, subject, html) {
  const tr = getTransporter();
  await tr.sendMail({ from: cfg.mail.from, to, subject, html });
  return true;
}

async function sendCode(to, code) {
  const html = `<p>Seu código de verificação é: ${code}</p>`;
  return sendMail(to, 'Código de verificação - Gestão Leiteira', html);
}

async function sendTemplate(to, subject, html) {
  return sendMail(to, subject, html);
}

module.exports = { sendMail, sendCode, sendTemplate };
