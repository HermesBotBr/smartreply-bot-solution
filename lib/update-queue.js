// lib/update-queue.js

const updateQueue = new Map();

export function addToUpdateQueue(sellerId, packId) {
  const updates = updateQueue.get(sellerId) || [];
  const existing = updates.find(u => u.pack_id === packId);

  if (existing) {
    existing.timestamp = new Date().toISOString();
  } else {
    updates.push({ pack_id: packId, timestamp: new Date().toISOString() });
  }

  updateQueue.set(sellerId, updates);
  console.log(`📝 Atualização adicionada: ${pack_id} para seller ${sellerId}`);
}

export function getQueue(sellerId) {
  return updateQueue.get(sellerId) || [];
}

export function clearQueueForSeller(sellerId) {
  updateQueue.set(sellerId, []);
}
