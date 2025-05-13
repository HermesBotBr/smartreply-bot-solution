
const axios = require('axios');
const express = require('express');
const router = express.Router();

// Configuração do Express
const app = express();

// Endpoint para buscar os dados de releases.txt
app.get('/api/refresh-releases', async (req, res) => {
  try {
    const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt');
    res.set('Content-Type', 'text/plain');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching releases.txt:', error.message);
    res.status(500).json({ error: 'Failed to fetch releases data' });
  }
});

// Configurar outras rotas do express se necessário
const server = require('../../server');
Object.keys(server._router.stack).forEach(route => {
  if (route !== '__proto__') {
    app._router.stack.push(server._router.stack[route]);
  }
});

module.exports = app;
