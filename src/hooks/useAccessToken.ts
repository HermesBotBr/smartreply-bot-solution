
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";
import { toast } from "sonner";

export function useAccessToken(sellerId: string | null) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Function to fetch access token
  const fetchAccessToken = async () => {
    if (!sellerId) {
      setAccessToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(getNgrokUrl('/api/db/rows/env'));
      
      if (response.data && Array.isArray(response.data.rows)) {
        const sellerData = response.data.rows.find(
          (row: any) => row.seller_id === sellerId
        );
        
        if (sellerData && sellerData.access_token) {
          setAccessToken(sellerData.access_token);
          console.log("Access token updated successfully for seller:", sellerId);
        } else {
          console.warn("Access token not found for seller:", sellerId);
          setError("Token de acesso não encontrado para este vendedor");
        }
      } else {
        console.error("Invalid response format for env data:", response.data);
        setError("Formato de resposta inválido ao carregar dados de autenticação");
      }
    } catch (error) {
      console.error("Error fetching access token:", error);
      setError("Erro ao carregar token de acesso");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup initial fetch and periodic refresh
  useEffect(() => {
    // Clear any existing interval when seller changes
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset states
    setIsLoading(true);
    setError(null);
    
    // Initial fetch
    fetchAccessToken();
    
    // Set up interval to refresh token every 5 minutes (300000 ms)
    if (sellerId) {
      intervalRef.current = window.setInterval(() => {
        console.log("Refreshing access token for seller:", sellerId);
        fetchAccessToken();
      }, 5 * 60 * 1000);
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sellerId]);

  return { accessToken, isLoading, error };
}
