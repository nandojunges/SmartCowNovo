const r = require('express').Router();
const c = require('../controllers/maintenanceController');
r.post('/api/v1/maintenance/promote-preparto', c.promotePreParto);
module.exports = r;
