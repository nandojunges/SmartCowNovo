const r = require('express').Router();
const c = require('../controllers/maintenanceController');
r.post('/api/maintenance/promote-preparto', c.promotePreParto);
module.exports = r;
