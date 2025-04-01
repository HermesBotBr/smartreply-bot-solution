// api/check-update-queue.js

const updateQueue = new Map();

function addToUpdateQueue(sellerId, packId) {
  const updates = updateQueue.get(sellerId) || [];
  const existing = updates.find(u => u.pack_id === packId);

  if (existing) {
    existing.timestamp = new Date().toISOString();
  } else {
    updates.push({ pack_id: packId, timestamp: new Date().toISOString() });
  }

  updateQueue.set(sellerId, updates);
  console.log(`📝 Atualização adicionada: ${packId} para seller ${sellerId}`);
}

function getQueue(sellerId) {
  return updateQueue.get(sellerId) || [];
}

function clearQueueForSeller(sellerId) {
  updateQueue.set(sellerId, []);
}

export default async function handler(req, res) {
  console.log("🔍 check-update-queue chamado com:", req.query);

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
    const updates = getQueue(seller_id);

    if (updates.length > 0) {
      console.log(`🔄 Enviando ${updates.length} atualizações para seller_id ${seller_id}`);
      clearQueueForSeller(seller_id);
    } else {
      console.log("ℹ️ Nenhuma atualização na fila.");
    }

    return res.status(200).json({
      success: true,
      updates
    });
  } catch (error) {
    console.error('Erro ao verificar fila:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao verificar fila'
    });
  }
}
