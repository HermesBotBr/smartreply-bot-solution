
import { useState, useEffect } from 'react';
import axios from 'axios';
import { SalesResponse } from '@/types/metrics';
import { NGROK_BASE_URL } from '@/config/api';

export function useSalesData(
  sellerId: string | null, 
  startDate: Date | undefined,
  endDate: Date | undefined,
  shouldFetch: boolean = false
) {
  const [salesData, setSalesData] = useState<SalesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!sellerId || !startDate || !endDate) {
      return;
    }

    const formattedStartDate = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const formattedEndDate = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${NGROK_BASE_URL}/vendas_ordem`, {
        params: {
          seller_id: sellerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          include_pack_id: true,
          include_created_date: true
        }
      });
      setSalesData(response.data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Falha ao carregar dados de vendas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [sellerId, startDate, endDate, shouldFetch]);

  return { salesData, isLoading, error, refetch: fetchData };
}
