import axios from 'axios';

export default async function handler(req, res) {
  console.log("🚀 Endpoint force-refresh-pack foi acionado.");

  if (req.method !== 'POST') {
    console.log("❌ Método inválido:", req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use POST.'
    });
  }

  const { seller_id, pack_id } = req.body;
  console.log("📦 seller_id:", seller_id, "| pack_id:", pack_id);

  if (!seller_id || !pack_id) {
    console.log("❗ seller_id ou pack_id ausentes.");
    return res.status(400).json({ 
      success: false, 
      error: 'Parâmetros obrigatórios ausentes: seller_id e pack_id são necessários'
    });
  }

  try {
    const apiUrl = process.env.HERMES_API_URL || 'https://projetohermes-dda7e0c8d836.herokuapp.com';
    const fullUrl = `${apiUrl}/conversas?seller_id=${seller_id}&pack_id=${pack_id}&limit=100&offset=0`;
    console.log("🔗 Buscando mensagens de:", fullUrl);

    const response = await axios.get(fullUrl);
    console.log("✅ Resposta recebida da API Hermes.");

    const messages = response.data?.messages || [];
    console.log(`📨 ${messages.length} mensagens recuperadas.`);

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

  } catch (error) {
    console.error('💥 Erro ao atualizar mensagens:', error.message, error?.stack);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Falha ao atualizar mensagens' 
    });
  }
}
