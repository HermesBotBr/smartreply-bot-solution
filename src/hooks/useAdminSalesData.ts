
import { useState, useEffect, useCallback } from 'react';
import { getNgrokUrl } from '@/config/api';
import axios from 'axios';

interface AdminSalesItem {
  total_amount: number;
  paid_amount: number;
  order_items: {
    quantity: number;
    item: {
      id: string;
      title?: string;
    };
  }[];
  id: string; // order_id
  date_created: string; // data e hora da venda
}

interface AdminSalesResponse {
  query: string;
  results: AdminSalesItem[];
}

interface DetailedSale {
  orderId: string;
  itemId: string;
  title?: string;
  quantity: number;
  dateCreated: string;
}

export function useAdminSalesData() {
  const [salesData, setSalesData] = useState<AdminSalesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalUnitsSold, setTotalUnitsSold] = useState<number>(0);
  const [salesByItemId, setSalesByItemId] = useState<Record<string, number>>({});
  const [detailedSales, setDetailedSales] = useState<DetailedSale[]>([]);
  
  const fetchSalesData = useCallback(async (sellerId: string, startDate: string, endDate: string) => {
    if (!sellerId || !startDate || !endDate) {
      return 0;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get<AdminSalesResponse>(
        `${getNgrokUrl(`/vendas_adm`)}`, {
          params: {
            seller_id: sellerId,
            start_date: startDate,
            end_date: endDate
          }
        }
      );
      
      setSalesData(response.data);
      
      // Armazenar todas as vendas detalhadas
      const allDetailedSales: DetailedSale[] = [];
      
      // Calculate total units sold and sales by item ID
      const salesByItem: Record<string, number> = {};
      const totalUnits = response.data?.results?.reduce((sum, item) => {
        // Sum up quantities from each order_item
        const orderItemsQuantity = item.order_items?.reduce((itemSum, orderItem) => {
          const itemId = orderItem.item?.id || '';
          
          // Incrementar contagem para este item específico
          if (itemId) {
            salesByItem[itemId] = (salesByItem[itemId] || 0) + (orderItem.quantity || 0);
            
            // Adicionar à lista detalhada de vendas
            allDetailedSales.push({
              orderId: item.id,
              itemId: itemId,
              title: orderItem.item?.title,
              quantity: orderItem.quantity || 0,
              dateCreated: item.date_created
            });
          }
          
          return itemSum + (orderItem.quantity || 0);
        }, 0) || 0;
        
        return sum + orderItemsQuantity;
      }, 0) || 0;
      
      setTotalUnitsSold(totalUnits);
      setSalesByItemId(salesByItem);
      setDetailedSales(allDetailedSales);
      
      // Registrar no console a lista de vendas
      console.log('Lista detalhada de vendas desde a primeira reposição:', allDetailedSales);
      
      setIsLoading(false);
      return totalUnits;
      
    } catch (err) {
      console.error('Error fetching admin sales data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
      return 0;
    }
  }, []);
  
  return { 
    salesData, 
    isLoading, 
    error, 
    totalUnitsSold, 
    salesByItemId, 
    detailedSales,
    fetchSalesData 
  };
}
