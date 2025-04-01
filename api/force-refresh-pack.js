
// Este endpoint permite forçar a atualização das mensagens de um pacote específico
// Pode ser chamado via Postman: POST /api/force-refresh-pack com body { seller_id, pack_id }

const express = require('express');
const axios = require('axios');

module.exports = async (req, res) => {
  // Verificar se é uma solicitação POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use POST.'
    });
  }

  // Obter seller_id e pack_id do corpo da solicitação
  const { seller_id, pack_id } = req.body;
  
  // Validar parâmetros obrigatórios
  if (!seller_id || !pack_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parâmetros obrigatórios ausentes: seller_id e pack_id são necessários'
    });
  }

  try {
    console.log(`Refresh manual acionado para pacote ${pack_id} do vendedor ${seller_id}`);
    
    // Chamar o mesmo endpoint que o frontend usa para buscar mensagens
    const apiUrl = process.env.HERMES_API_URL || 'https://projetohermes-dda7e0c8d836.herokuapp.com';
    const response = await axios.get(`${apiUrl}/conversas`, {
      params: {
        seller_id: seller_id,
        pack_id: pack_id,
        limit: 100,
        offset: 0
      }
    });
    
    // Verificar se a resposta contém mensagens
    if (response.data && Array.isArray(response.data.messages)) {
      const messages = response.data.messages;
      console.log(`Recuperadas ${messages.length} mensagens para o pacote ${pack_id}`);
      
      // Adicionar notificação para o sistema Hermes
      // Esta é uma implementação simplificada do sistema de notificação
      // O frontend irá pegar esta atualização na próxima verificação
      return res.status(200).json({
        success: true,
        message: `Recuperadas ${messages.length} mensagens para o pacote ${pack_id}`,
        data: {
          pack_id,
          seller_id,
          messages_count: messages.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma mensagem encontrada ou formato de resposta inválido',
        data: {
          pack_id,
          seller_id,
          messages_count: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao atualizar mensagens:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Falha ao atualizar mensagens' 
    });
  }
};
