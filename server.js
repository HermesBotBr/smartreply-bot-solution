
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Para armazenar o timestamp da última atualização forçada
let lastUpdateTimestamp = null;

// Configura middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// Rota para enviar notificação
app.post('/notification-endpoint', (req, res) => {
  const message = req.body.message || 'Um cliente aguarda atendimento humano';
  
  // Aqui você implementaria a lógica para enviar a notificação via push,
  // utilizando, por exemplo, a biblioteca web-push e as assinaturas dos usuários.
  // Para este exemplo, apenas logamos a mensagem e retornamos uma resposta de sucesso.
  console.log('Recebida requisição de notificação:', message);
  
  // Resposta simulada de sucesso
  res.status(200).json({ success: true, message: message });
});

// Rota para forçar atualização de todas as conversas
app.post('/api/update-all-conversations', async (req, res) => {
  try {
    console.log('Forçando atualização de todas as conversas...');
    
    // Aqui você implementaria a lógica real para forçar a atualização
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Atualiza o timestamp
    lastUpdateTimestamp = new Date().toISOString();
    
    res.status(200).json({ 
      success: true, 
      message: 'Atualização de todas as conversas iniciada com sucesso.',
      timestamp: lastUpdateTimestamp
    });
  } catch (error) {
    console.error('Erro ao atualizar todas as conversas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao atualizar conversas.' 
    });
  }
});

// Rota para verificar se há atualizações forçadas
app.get('/api/update-all-conversations', (req, res) => {
  res.status(200).json({ timestamp: lastUpdateTimestamp });
});

// Nova rota para trocar o código de autorização por tokens do Mercado Livre
app.post('/exchange-token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de autorização não fornecido'
      });
    }

    console.log('Trocando código por token:', code);
    console.log('Redirect URI:', redirect_uri);
    
    // Parâmetros para o Mercado Livre
    const CLIENT_ID = '92915837539562';
    const CLIENT_SECRET = 'RsK8hvmg9ER77h1SCo8XKBNopBg6GzF5';
    
    // Fazer a requisição ao Mercado Livre para trocar o código por tokens
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://api.mercadolibre.com/oauth/token',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_uri
      }).toString()
    });
    
    console.log('Resposta da troca de tokens:', tokenResponse.data);
    
    // Retorna os tokens para o cliente
    res.status(200).json({
      success: true,
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
      expires_in: tokenResponse.data.expires_in
    });
  } catch (error) {
    console.error('Erro ao trocar código por token:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao trocar código por token',
      error: error.response?.data || error.message
    });
  }
});

// Proxy para o endpoint getTokens do Projeto Hermes
app.post('/proxy/getTokens', async (req, res) => {
  try {
    const { authorization_code } = req.body;
    
    if (!authorization_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de autorização não fornecido'
      });
    }

    console.log('Encaminhando código para o servidor Hermes:', authorization_code);
    
    // Faz a requisição para o servidor externo
    const response = await axios.post(
      'https://projetohermes-dda7e0c8d836.herokuapp.com/getTokens',
      { authorization_code },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    
    console.log('Resposta do servidor Hermes:', response.data);
    
    // Repassa a resposta para o cliente
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro ao encaminhar código para o servidor Hermes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar solicitação',
      error: error.response?.data || error.message
    });
  }
});

// New endpoint to handle login authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { sellerId, password } = req.body;
    
    if (!sellerId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do vendedor e senha são obrigatórios' 
      });
    }

    // Database connection info
    const connectionString = 'mysql://y0pxd1g143rqh6op:yfpdemk5z2hhczyd@lmag6s0zwmcswp5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p4zb0v2reda2hbui';
    
    // Extract db connection details from the connection string
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      console.error('Invalid connection string format');
      return res.status(500).json({ 
        success: false, 
        message: 'Erro na configuração do banco de dados' 
      });
    }
    
    const [, user, password_db, host, port, database] = match;
    
    // Use mysql2 package for MySQL connection
    const mysql = require('mysql2/promise');
    
    // Create a connection
    const connection = await mysql.createConnection({
      host,
      user,
      password: password_db,
      database,
      port: parseInt(port, 10)
    });
    
    // Query the database
    const [rows] = await connection.execute(
      'SELECT * FROM env WHERE seller_id = ? AND password_id = ?',
      [sellerId, password]
    );
    
    // Close the connection
    await connection.end();
    
    // Check if user exists
    if (rows.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Autenticação bem-sucedida' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'ID do vendedor ou senha inválidos' 
      });
    }
    
  } catch (error) {
    console.error('Erro durante autenticação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor durante autenticação',
      error: error.message
    });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
