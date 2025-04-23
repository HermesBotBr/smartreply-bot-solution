
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ReputationResponse } from '@/types/metrics';
import { NGROK_BASE_URL } from '@/config/api';

export function useReputationData(sellerId: string | null) {
  const [reputation, setReputation] = useState<ReputationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${NGROK_BASE_URL}/ep_reputation`, {
          params: { seller_id: sellerId }
        });
        setReputation(response.data);
      } catch (err) {
        console.error('Error fetching reputation data:', err);
        setError('Falha ao carregar dados de reputação');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  return { reputation, isLoading, error };
}
