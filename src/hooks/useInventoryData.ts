
import { useState, useEffect, useCallback } from 'react';
import { getNgrokUrl } from '@/config/api';
import { TransDesc, InventoryItem } from '@/types/inventory';

export function useInventoryData(sellerId: string | null) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [releaseDates, setReleaseDates] = useState<Record<string, string>>({});
  
  // Function to process and extract dates from release data
  const processReleaseDates = useCallback(() => {
    console.log('Processing release dates from localStorage');
    const releaseData = localStorage.getItem('releaseData');
    const sourceIdToDateMap: Record<string, string> = {};
    
    if (releaseData) {
      const lines = releaseData.split('\n').filter(line => line.trim() !== '');
      
      // Skip headers and process data lines
      if (lines.length > 2) {
        lines.slice(2).forEach(line => {
          if (!line.startsWith(',,,total')) {
            const cols = line.split(',');
            if (cols.length >= 2) {
              const dateStr = cols[0].trim();
              const sourceId = cols[1].trim();
              
              if (dateStr && sourceId) {
                try {
                  // Format date as DD/MM/YYYY
                  const date = new Date(dateStr);
                  const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                  sourceIdToDateMap[sourceId] = formattedDate;
                } catch (err) {
                  // Skip invalid dates
                }
              }
            }
          }
        });
      }
    }
    
    setReleaseDates(sourceIdToDateMap);
    return sourceIdToDateMap;
  }, []);
  
  // Function to update inventory items with dates
  const updateInventoryWithDates = useCallback((items: InventoryItem[], dates: Record<string, string>) => {
    return items.map(item => {
      const updatedPurchases = item.purchases.map(purchase => ({
        ...purchase,
        date: dates[purchase.sourceId] || purchase.date
      }));
      
      return {
        ...item,
        purchases: updatedPurchases
      };
    });
  }, []);

  // Function to refresh dates
  const refreshDates = useCallback(() => {
    console.log('Refreshing dates from release data');
    const dates = processReleaseDates();
    setInventoryItems(prevItems => updateInventoryWithDates(prevItems, dates));
  }, [processReleaseDates, updateInventoryWithDates]);

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
        
        // Process release data to get dates for source_ids
        const sourceIdToDateMap = processReleaseDates();
        
        // Process the transaction data to extract inventory items
        const inventoryMap = new Map<string, InventoryItem>();
        
        transDescData.forEach(transaction => {
          const { descricao, valor, source_id } = transaction;
          
          // Check if this is a merchandise purchase or withdrawal
          if (descricao.includes('Compra de mercadoria:')) {
            // Extract item information using regex for both positive and negative quantities
            const match = descricao.match(/(-?\d+)x\s(.+)\s\(([A-Z0-9]+)\)/);
            
            if (match) {
              const quantity = parseInt(match[1], 10); // This can now be positive or negative
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
              
              // Update total quantity (can now add or subtract based on sign)
              item.totalQuantity += quantity;
              
              // Add this purchase/withdrawal with date if available
              item.purchases.push({
                quantity,
                unitCost,
                totalCost,
                sourceId: source_id,
                date: sourceIdToDateMap[source_id] || undefined
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
  }, [sellerId, processReleaseDates]);

  return { items: inventoryItems, isLoading, error, refreshDates };
}
