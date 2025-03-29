
const express = require('express');
const router = express.Router();
const { pool } = require('../utils/dbConnection');

// Middleware to catch and format errors
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  });

// Rota para listar todas as tabelas
router.get('/tables', asyncHandler(async (req, res) => {
  // Consulta para listar todas as tabelas do banco de dados atual
  const [rows] = await pool.query('SHOW TABLES');
  
  // O nome da coluna depende do nome do banco de dados, então pegamos a chave do primeiro objeto
  const tables = Array.isArray(rows) && rows.length > 0 
    ? rows.map(row => {
        const key = Object.keys(row)[0];
        return { TABLE_NAME: row[key] };
      })
    : [];
    
  res.json({ tables });
}));

// Rota para obter estrutura da tabela (colunas)
router.get('/columns', asyncHandler(async (req, res) => {
  const { table } = req.query;
  if (!table) {
    return res.status(400).json({ error: 'Nome da tabela não fornecido' });
  }
  
  const [columns] = await pool.query(`DESCRIBE ${table}`);
  res.json({ columns });
}));

// Rota para obter dados da tabela
router.get('/data', asyncHandler(async (req, res) => {
  const { table } = req.query;
  if (!table) {
    return res.status(400).json({ error: 'Nome da tabela não fornecido' });
  }
  
  const [data] = await pool.query(`SELECT * FROM ${table} LIMIT 100`);
  res.json({ data });
}));

// Rota para executar consultas SQL personalizadas
router.post('/query', asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Consulta SQL não fornecida' });
  }
  
  // Verifica se é uma consulta SELECT
  const isSelect = query.trim().toUpperCase().startsWith('SELECT');
  
  const [results, fields] = await pool.query(query);
  
  if (isSelect) {
    res.json({ isSelect, results, fields });
  } else {
    res.json({ isSelect, affectedRows: results.affectedRows });
  }
}));

module.exports = router;
