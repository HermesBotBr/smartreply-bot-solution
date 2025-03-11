// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura middlewares
app.use(cors());
app.use(bodyParser.json());

// Rota real para enviar notificação
app.post('/notification-endpoint', (req, res) => {
  const message = req.body.message || 'Um cliente aguarda atendimento humano';
  
  // Aqui você implementaria a lógica para enviar a notificação via push,
  // utilizando, por exemplo, a biblioteca web-push e as assinaturas dos usuários.
  // Para este exemplo, apenas logamos a mensagem e retornamos uma resposta de sucesso.
  console.log('Recebida requisição de notificação:', message);
  
  // Resposta simulada de sucesso
  res.status(200).json({ success: true, message: message });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
