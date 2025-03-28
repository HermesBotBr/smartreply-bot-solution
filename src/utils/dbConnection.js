
const mysql = require('mysql2/promise');

// Cria um pool de conexões usando a URL do JAWSDB
const pool = mysql.createPool({
  uri: 'mysql://y0pxd1g143rqh6op:yfpdemk5z2hhczyd@lmag6s0zwmcswp5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p4zb0v2reda2hbui',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para testar a conexão
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao MySQL com sucesso!');
    connection.release();
    return true;
  } catch (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return false;
  }
}

// Exporta o pool e a função de teste
module.exports = { pool, testConnection };
