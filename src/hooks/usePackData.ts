
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";

export interface Pack {
  pack_id: string;
  gpt: string;
  seller_id: string;
  // Add any other fields that might be in the table
}

export function usePackData(sellerId: string | null) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackData = async () => {
      if (!sellerId) {
        setPacks([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Use the correct endpoint to fetch all packs
        const response = await axios.get(getNgrokUrl('/api/db/rows/all_packs'));

        if (response.data && response.data.rows) {
          // Filter packs by sellerId on the client side
          const sellerPacks = response.data.rows.filter(
            (pack: Pack) => pack.seller_id === sellerId
          );
          setPacks(sellerPacks);
          console.log("Pack data loaded successfully:", sellerPacks.length, "packs");
        } else {
          console.error("Invalid response format for pack data:", response.data);
          setError("Formato de resposta inválido ao carregar dados de pacotes");
        }
      } catch (error) {
        console.error("Error fetching pack data:", error);
        setError("Erro ao carregar dados de pacotes. Verifique a conexão com o servidor.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPackData();
  }, [sellerId]);

  return { packs, isLoading, error };
}
