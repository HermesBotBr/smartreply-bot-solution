
import { useState, useEffect, useCallback } from 'react';
import { getNgrokUrl } from '@/config/api';
import axios from 'axios';

interface AdminSalesItem {
  total_amount: number;
  paid_amount: number;
  order_items: {
    quantity: number;
  }[];
}

interface AdminSalesResponse {
  query: string;
  results: AdminSalesItem[];
}

export function useAdminSalesData() {
  const [salesData, setSalesData] = useState<AdminSalesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalUnitsSold, setTotalUnitsSold] = useState<number>(0);
  
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
      
      // Calculate total units sold
      const totalUnits = response.data?.results?.reduce((sum, item) => {
        // Sum up quantities from each order_item
        const orderItemsQuantity = item.order_items?.reduce((itemSum, orderItem) => {
          return itemSum + (orderItem.quantity || 0);
        }, 0) || 0;
        
        return sum + orderItemsQuantity;
      }, 0) || 0;
      
      setTotalUnitsSold(totalUnits);
      setIsLoading(false);
      return totalUnits;
      
    } catch (err) {
      console.error('Error fetching admin sales data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
      return 0;
    }
  }, []);
  
  return { salesData, isLoading, error, totalUnitsSold, fetchSalesData };
}
