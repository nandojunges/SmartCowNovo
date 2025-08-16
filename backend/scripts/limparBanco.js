const { getUserDir } = require('../db');
const fs = require('fs');
const path = require('path');

const email = 'gestaoleiteirasmartcow@gmail.com';
const userDir = getUserDir(email);

function apagarTudo() {
  if (!fs.existsSync(userDir)) {
    console.log(`⚠️ Pasta do usuário ${userDir} não encontrada. Nada para apagar.`);
    return;
  }

  try {
    // ⚙️ Remove a pasta inteira, com banco e backups
    fs.rmSync(userDir, { recursive: true, force: true });
    console.log(`✅ Tudo removido da pasta: ${userDir}`);
  } catch (err) {
    console.error(`❌ Erro ao remover a pasta: ${err.message}`);
  }
}

apagarTudo();
