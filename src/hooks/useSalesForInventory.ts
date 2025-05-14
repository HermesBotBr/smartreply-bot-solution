
import { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { SalesResponse } from '@/types/metrics';
import { getNgrokUrl } from '@/config/api';
import { formatDateToDisplay } from '@/utils/dateFormatters';
import { toast } from '@/hooks/use-toast';

export interface SalesByItemId {
  [itemId: string]: number;
}

export function useSalesForInventory(sellerId: string | null, inventoryItems: InventoryItem[]) {
  const [salesByItemId, setSalesByItemId] = useState<SalesByItemId>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!sellerId || !inventoryItems.length) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Find the oldest purchase date across all items
        let oldestDate: Date | null = null;
        
        inventoryItems.forEach(item => {
          item.purchases.forEach(purchase => {
            if (purchase.date) {
              // Parse the date (assuming format is DD/MM/YYYY)
              const [day, month, year] = purchase.date.split('/').map(Number);
              const purchaseDate = new Date(year, month - 1, day);
              
              if (!oldestDate || purchaseDate < oldestDate) {
                oldestDate = purchaseDate;
              }
            }
          });
        });
        
        // If no date found, use 30 days ago as fallback
        if (!oldestDate) {
          oldestDate = new Date();
          oldestDate.setDate(oldestDate.getDate() - 30);
        }
        
        // Format dates for API call
        const startDateFormatted = formatDateToDisplay(oldestDate);
        const endDateFormatted = formatDateToDisplay(new Date());
        
        // Fetch sales data from API
        const response = await fetch(
          getNgrokUrl(`/vendas_adm?seller_id=${sellerId}&start_date=${startDateFormatted}&end_date=${endDateFormatted}`)
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }
        
        const salesData = await response.json();
        
        // Process sales data to count sales by product ID
        const salesCount: SalesByItemId = {};
        
        if (salesData?.results) {
          salesData.results.forEach(sale => {
            sale.order_items?.forEach(orderItem => {
              const itemId = orderItem.item.seller_sku?.split('_')?.[0] || orderItem.item.id;
              
              if (itemId) {
                // Match the ID format in inventory (remove "MLB" prefix if needed)
                const normalizedItemId = itemId.replace('MLB', '');
                salesCount[normalizedItemId] = (salesCount[normalizedItemId] || 0) + orderItem.quantity;
              }
            });
          });
        }
        
        setSalesByItemId(salesCount);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
        toast({
          title: "Erro ao carregar dados de vendas",
          description: "Não foi possível obter o histórico de vendas para os produtos.",
          variant: "destructive"
        });
      }
    };

    fetchSalesData();
  }, [sellerId, inventoryItems]);

  return { salesByItemId, isLoading, error };
}
