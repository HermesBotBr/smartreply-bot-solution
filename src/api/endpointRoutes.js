
const express = require('express');
const router = express.Router();

// Rota para processar chamadas ao endpoint de teste
router.all('/endpoint-test', (req, res) => {
  try {
    // Obter a mensagem do corpo da requisição (se for POST) ou dos parâmetros query (se for GET)
    const message = req.method === 'POST' 
      ? req.body.message || "Chamada recebida via POST"
      : req.query.message || "Chamada recebida via GET";
    
    console.log(`Endpoint test called with message: ${message}`);
    
    // Emitir evento para o socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('endpointTest', { 
        message,
        timestamp: new Date().toISOString(),
        method: req.method
      });
    } else {
      console.error('Socket.io não está disponível!');
    }
    
    // Responder com sucesso
    return res.status(200).json({
      success: true,
      message: "Endpoint chamado com sucesso",
      data: {
        received_message: message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro no endpoint de teste:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Ocorreu um erro no processamento do endpoint de teste'
    });
  }
});

module.exports = router;
