const express = require('express');
const router = express.Router();

// Simple in-memory store for mock collections
const store = {
  dietas: [],
  ciclosLimpeza: [],
  manejosSanitarios: [],
  ajustesEstoque: [],
  configUsuario: [],
  medicaoLeite: [],
  configPEV: [],
  config: []
};

Object.keys(store).forEach(col => {
  router.get(`/${col}`, (req, res) => {
    res.json(store[col]);
  });

  router.post(`/${col}`, (req, res) => {
    store[col].push(req.body);
    res.status(201).json(req.body);
  });
});

module.exports = router;
