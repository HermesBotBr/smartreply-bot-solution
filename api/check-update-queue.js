
// Este arquivo implementa um endpoint que verifica se há atualizações na fila
// para um determinado vendedor

// Armazenamos as atualizações em memória para simular uma fila
// Em produção, isso deveria usar um banco de dados ou Redis
const updateQueue = new Map();

export default async function handler(req, res) {
  // Apenas GET é permitido neste endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use GET.'
    });
  }

  const { seller_id } = req.query;

  if (!seller_id) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetro obrigatório ausente: seller_id é necessário'
    });
  }

  try {
    // Obtém as atualizações pendentes para este vendedor
    const updates = updateQueue.get(seller_id) || [];
    
    // Limpa a fila após retornar
    if (updates.length > 0) {
      console.log(`🔄 Enviando ${updates.length} atualizações para o seller_id ${seller_id}`);
      updateQueue.set(seller_id, []);
    }
    
    return res.status(200).json({
      success: true,
      updates
    });
  } catch (error) {
    console.error('Erro ao verificar fila de atualizações:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao verificar fila de atualizações'
    });
  }
}

// Exportamos esta função para ser usada por outros endpoints
export function addToUpdateQueue(sellerId, packId) {
  const updates = updateQueue.get(sellerId) || [];
  
  // Verificamos se já existe uma atualização para este pacote
  const existingUpdateIndex = updates.findIndex(update => update.pack_id === packId);
  
  if (existingUpdateIndex !== -1) {
    // Se já existe, atualizamos o timestamp
    updates[existingUpdateIndex].timestamp = new Date().toISOString();
  } else {
    // Se não existe, adicionamos uma nova atualização
    updates.push({
      pack_id: packId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Atualizamos a fila
  updateQueue.set(sellerId, updates);
  console.log(`📝 Adicionada atualização para o pacote ${packId} do seller ${sellerId}. Fila atual:`, updates);
}
