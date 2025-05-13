
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import { TransDesc, InventoryItem } from '@/types/inventory';

export function useInventoryData(sellerId: string | null) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch transactions with merchandise purchase descriptions
        const transDescResponse = await fetch(
          `${getNgrokUrl(`/trans_desc?seller_id=${sellerId}`)}`
        );
        
        if (!transDescResponse.ok) {
          throw new Error('Failed to fetch transaction descriptions');
        }
        
        const transDescData: TransDesc[] = await transDescResponse.json();
        
        // Process the transaction data to extract inventory items
        const inventoryMap = new Map<string, InventoryItem>();
        
        transDescData.forEach(transaction => {
          const { descricao, valor, source_id } = transaction;
          
          // Check if this is a merchandise purchase
          if (descricao.startsWith('Compra de mercadoria:')) {
            // Extract item information using regex
            const match = descricao.match(/(\d+)x\s(.+)\s\(([A-Z0-9]+)\)/);
            
            if (match) {
              const quantity = parseInt(match[1], 10);
              const title = match[2].trim();
              const itemId = match[3].trim();
              const totalCost = parseFloat(valor);
              const unitCost = totalCost / quantity;
              
              // Create or update the inventory item
              if (!inventoryMap.has(itemId)) {
                inventoryMap.set(itemId, {
                  itemId,
                  title,
                  totalQuantity: 0,
                  purchases: []
                });
              }
              
              const item = inventoryMap.get(itemId)!;
              
              // Update total quantity
              item.totalQuantity += quantity;
              
              // Add this purchase
              item.purchases.push({
                quantity,
                unitCost,
                totalCost,
                sourceId: source_id
              });
            }
          }
        });
        
        setInventoryItems(Array.from(inventoryMap.values()));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [sellerId]);

  return { items: inventoryItems, isLoading, error };
}
