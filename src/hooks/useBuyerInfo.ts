
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';

interface BuyerInfo {
  id: number;
  nickname: string;
  country_id: string;
  address?: {
    city?: string;
    state?: string;
  };
}

export function useBuyerInfo(sellerId: string | null, userId: number | null) {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuyerInfo = async () => {
      if (!sellerId || !userId) {
        setBuyerInfo(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(getNgrokUrl(`/buyer?seller_id=${sellerId}&user_id=${userId}`));
        setBuyerInfo(response.data);
      } catch (err: any) {
        console.error("Error fetching buyer info:", err);
        setError("Erro ao buscar informações do comprador");
        setBuyerInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuyerInfo();
  }, [sellerId, userId]);

  return { buyerInfo, isLoading, error };
}
