// api/force-refresh-pack.js

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST' });
  }

  const { seller_id, pack_id } = req.body;

  if (!seller_id || !pack_id) {
    return res.status(400).json({ success: false, error: 'Parâmetros obrigatórios ausentes' });
  }

  try {
    // Busca mensagens
    const apiUrl = process.env.HERMES_API_URL || 'https://projetohermes-dda7e0c8d836.herokuapp.com';
    const fullUrl = `${apiUrl}/conversas?seller_id=${seller_id}&pack_id=${pack_id}&limit=3000&offset=0`;

    const response = await axios.get(fullUrl);
    const messages = response.data?.messages || [];

    console.log(`📨 ${messages.length} mensagens recuperadas para ${pack_id}`);

    // Adiciona notificação ao sistema remoto
    await axios.post(`${apiUrl}/notifications`, {
      seller_id,
      pack_id
    });

    console.log(`🔔 Notificação adicionada para ${pack_id} de ${seller_id}`);

    return res.status(200).json({
      success: true,
      message: `Recuperadas ${messages.length} mensagens`,
      data: {
        seller_id,
        pack_id,
        messages_count: messages.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('💥 Erro:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
