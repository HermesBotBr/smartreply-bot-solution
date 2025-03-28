
const express = require('express');
const router = express.Router();
const { pool } = require('../utils/dbConnection');

// Rota para listar todas as tabelas
router.get('/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    const tables = rows.map(row => {
      const tableName = Object.values(row)[0];
      return { tableName };
    });
    res.json({ tables });
  } catch (error) {
    console.error('Erro ao buscar tabelas:', error);
    res.status(500).json({ error: 'Erro ao buscar tabelas' });
  }
});

// Rota para obter estrutura da tabela (colunas)
router.get('/columns', async (req, res) => {
  try {
    const { table } = req.query;
    if (!table) {
      return res.status(400).json({ error: 'Nome da tabela não fornecido' });
    }
    
    const [columns] = await pool.query(`DESCRIBE ${table}`);
    res.json({ columns });
  } catch (error) {
    console.error('Erro ao buscar colunas:', error);
    res.status(500).json({ error: 'Erro ao buscar colunas' });
  }
});

// Rota para obter dados da tabela
router.get('/data', async (req, res) => {
  try {
    const { table } = req.query;
    if (!table) {
      return res.status(400).json({ error: 'Nome da tabela não fornecido' });
    }
    
    const [data] = await pool.query(`SELECT * FROM ${table} LIMIT 100`);
    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// Rota para executar consultas SQL personalizadas
router.post('/query', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    res.status(500).json({ error: 'Erro ao executar consulta: ' + error.message });
  }
});

module.exports = router;
