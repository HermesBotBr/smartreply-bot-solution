
import { useState, useEffect } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

interface AllGptColumn {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

interface AllGptRow {
  [key: string]: string | number | null;  // Changed the index signature to accept string, number, or null
  entry_id: string | number;  // Accept both string and number for entry_id
}

export function useAllGptData(sellerId: string | null) {
  const [columns, setColumns] = useState<AllGptColumn[]>([]);
  const [rows, setRows] = useState<AllGptRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gptMessageIds, setGptMessageIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllGptData = async () => {
      if (!sellerId) {
        setGptMessageIds([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all rows directly from the allgpt table using the correct endpoint
        const response = await axios.get(`${NGROK_BASE_URL}/api/db/rows/allgpt`);
        const allRows = response.data.rows || [];
        setRows(allRows);
        
        console.log(`Total de linhas recebidas da tabela allgpt: ${allRows.length}`);
        
        // Extract message IDs for this seller
        const messageIds = allRows
          .filter(row => row[sellerId] !== null && row[sellerId] !== '')
          .map(row => row[sellerId] as string);
        
        setGptMessageIds(messageIds);
        console.log(`ALLGPT - IDs de mensagens GPT para o vendedor ${sellerId}:`, messageIds);
        console.log(`Total de ${messageIds.length} IDs de mensagens GPT encontrados`);
      } catch (err: any) {
        console.error("Erro ao buscar dados allgpt:", err);
        setError("Erro ao buscar dados da tabela allgpt");
        setGptMessageIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllGptData();
  }, [sellerId]);

  return { gptMessageIds, isLoading, error };
}
