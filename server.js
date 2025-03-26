
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
