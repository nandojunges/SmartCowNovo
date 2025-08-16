const cron = require('node-cron');
const animalsService = require('../services/animalsService');

function schedulePrePartoJob() {
  cron.schedule('0 0 * * *', () => {
    animalsService.promoteBatchPreParto();
  });
}

module.exports = schedulePrePartoJob;
