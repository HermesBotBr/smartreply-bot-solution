
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import { InventoryItem } from '@/types/inventory';
import { format } from 'date-fns';

interface SalesOrderItem {
  item: {
    id: string;
    title: string;
  };
  quantity: number;
}

interface SalesOrder {
  order_items: SalesOrderItem[];
  date_created: string;
}

interface SalesResponse {
  results: SalesOrder[];
}

export function useSalesDataForInventory(
  sellerId: string | null,
  inventoryItems: InventoryItem[]
) {
  const [salesByProduct, setSalesByProduct] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!sellerId || inventoryItems.length === 0) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Find earliest purchase date across all inventory items
        let earliestDate: Date | null = null;
        
        inventoryItems.forEach(item => {
          item.purchases.forEach(purchase => {
            if (purchase.date) {
              // Parse date in DD/MM/YYYY format
              const [day, month, year] = purchase.date.split('/').map(Number);
              const purchaseDate = new Date(year, month - 1, day);
              
              if (!earliestDate || purchaseDate < earliestDate) {
                earliestDate = purchaseDate;
              }
            }
          });
        });
        
        if (!earliestDate) {
          // If no date found, default to 30 days ago
          earliestDate = new Date();
          earliestDate.setDate(earliestDate.getDate() - 30);
        }
        
        // Format dates for API request
        const startDateFormatted = format(earliestDate, 'dd/MM/yyyy');
        const endDateFormatted = format(new Date(), 'dd/MM/yyyy');
        
        // Fetch sales data from API
        const response = await fetch(
          getNgrokUrl(`/vendas_adm?seller_id=${sellerId}&start_date=${startDateFormatted}&end_date=${endDateFormatted}`)
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }
        
        const salesData: SalesResponse = await response.json();
        
        // Process sales data to count sales per product
        const productSalesCount: Record<string, number> = {};
        
        salesData.results.forEach(order => {
          order.order_items.forEach(item => {
            const productId = item.item.id;
            if (!productSalesCount[productId]) {
              productSalesCount[productId] = 0;
            }
            productSalesCount[productId] += item.quantity;
          });
        });
        
        setSalesByProduct(productSalesCount);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [sellerId, inventoryItems]);

  return { salesByProduct, isLoading, error };
}
