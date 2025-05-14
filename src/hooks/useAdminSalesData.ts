
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
      title: string;
    };
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
  const [productSalesMap, setProductSalesMap] = useState<Record<string, number>>({});
  
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
      let totalUnits = 0;
      const productSales: Record<string, number> = {};
      
      response.data?.results?.forEach(item => {
        // Process each order item
        item.order_items?.forEach(orderItem => {
          const quantity = orderItem.quantity || 0;
          totalUnits += quantity;
          
          // Track sales by product ID
          const productId = orderItem.item?.id;
          if (productId) {
            productSales[productId] = (productSales[productId] || 0) + quantity;
          }
        });
      });
      
      setTotalUnitsSold(totalUnits);
      setProductSalesMap(productSales);
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
    productSalesMap, 
    fetchSalesData 
  };
}
