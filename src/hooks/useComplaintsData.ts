
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ComplaintsResponse } from '@/types/metrics';
import { NGROK_BASE_URL } from '@/config/api';

export function useComplaintsData(
  sellerId: string | null, 
  startDate: Date | undefined,
  endDate: Date | undefined,
  reputationImpact: boolean = false,
  shouldFetch: boolean = false
) {
  const [complaintsData, setComplaintsData] = useState<ComplaintsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId || !startDate || !endDate || !shouldFetch) {
        return;
      }

      const formattedStartDate = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
      const formattedEndDate = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

      try {
        setIsLoading(true);
        setError(null);
        const params: Record<string, string> = {
          seller_id: sellerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        };
        
        if (reputationImpact) {
          params.reputation_impact = 'affected';
        }
        
        const response = await axios.get(`${NGROK_BASE_URL}/vendas_com_reclamacoes`, { params });
        setComplaintsData(response.data);
      } catch (err) {
        console.error('Error fetching complaints data:', err);
        setError('Falha ao carregar dados de reclamações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId, startDate, endDate, reputationImpact, shouldFetch]);

  return { complaintsData, isLoading, error };
}
