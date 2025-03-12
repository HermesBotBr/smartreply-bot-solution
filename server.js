
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Para armazenar o timestamp da última atualização forçada
let lastUpdateTimestamp = null;

// Configura middlewares
app.use(cors());
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
