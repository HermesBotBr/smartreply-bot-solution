
import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { getNgrokUrl } from '@/config/api';
import { ClientData } from './usePackClientData';

export function useSaleDetails() {
  const [saleDetails, setSaleDetails] = useState<ClientData | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track the currently displayed conversation to prevent duplicate fetches
  const currentConvRef = useRef<{packId: string | null, sellerId: string | null}>({
    packId: null,
    sellerId: null
  });

  // Clear details when panel is closed
  useEffect(() => {
    if (!showSaleDetails) {
      setSaleDetails(null);
      setError(null);
    }
  }, [showSaleDetails]);

  const fetchSaleDetails = async (packId: string | null, sellerId: string | null) => {
    // Skip if no packId or sellerId provided
    if (!packId || !sellerId) {
      setError("ID do pacote ou vendedor não fornecido");
      return;
    }

    // Avoid duplicate fetches for the same conversation
    if (currentConvRef.current.packId === packId && 
        currentConvRef.current.sellerId === sellerId &&
        saleDetails !== null) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getNgrokUrl(`/detetive?seller_id=${sellerId}&pack_id=${packId}`));
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Sale details fetched:", data);
      
      setSaleDetails(data);
      currentConvRef.current = { packId, sellerId };
    } catch (error) {
      console.error("Error fetching sale details:", error);
      setError(error instanceof Error ? error.message : "Erro ao buscar detalhes da venda");
      toast.error("Não foi possível carregar os detalhes da venda");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saleDetails,
    showSaleDetails,
    setShowSaleDetails,
    isLoading,
    error,
    fetchSaleDetails
  };
}
