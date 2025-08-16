const express = require('express');
const router = express.Router();

// Lista fixa de raças
const racas = ['Holandês', 'Jersey', 'Girolando', 'Gir', 'Pardo Suíço'];

router.get('/', (req, res) => {
  res.json(racas);
});

module.exports = router;
