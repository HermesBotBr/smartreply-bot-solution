
const express = require('express');
const router = express.Router();

// Armazena as últimas chamadas para o endpoint
const endpointCalls = {
  lastCalls: [],
  totalCalls: 0
};

// Rota para processar chamadas ao endpoint de teste
router.all('/endpoint-test', (req, res) => {
  try {
    // Obter a mensagem do corpo da requisição (se for POST) ou dos parâmetros query (se for GET)
    const message = req.method === 'POST' 
      ? req.body.message || "Chamada recebida via POST"
      : req.query.message || "Chamada recebida via GET";
    
    console.log(`Endpoint test called with message: ${message}`);
    
    // Armazenar informações da chamada
    const callData = { 
      message,
      timestamp: new Date().toISOString(),
      method: req.method
    };
    
    endpointCalls.lastCalls.unshift(callData);
    endpointCalls.totalCalls++;
    
    // Manter apenas as últimas 10 chamadas
    if (endpointCalls.lastCalls.length > 10) {
      endpointCalls.lastCalls = endpointCalls.lastCalls.slice(0, 10);
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

// Rota para obter as informações das chamadas anteriores
router.get('/endpoint-test/status', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: endpointCalls
    });
  } catch (error) {
    console.error('Erro ao obter status do endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Ocorreu um erro ao obter o status do endpoint'
    });
  }
});

module.exports = router;
