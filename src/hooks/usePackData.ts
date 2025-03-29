
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
        // Construct the SQL query to get packs for the specific seller_id
        const query = `SELECT pack_id, gpt, seller_id FROM all_packs WHERE seller_id = '${sellerId}'`;
        const encodedQuery = encodeURIComponent(query);
        
        const response = await axios.post(getNgrokUrl('/api/db/query'), {
          query: query
        });

        if (response.data && response.data.results) {
          setPacks(response.data.results);
          console.log("Pack data loaded successfully:", response.data.results.length, "packs");
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
