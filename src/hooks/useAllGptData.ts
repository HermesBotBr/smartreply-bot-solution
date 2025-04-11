
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
  [key: string]: any;
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
        // Fetch columns to identify the correct column for this seller
        const columnsResponse = await axios.get(`${NGROK_BASE_URL}/api/db/columns/allgpt`);
        const allColumns: AllGptColumn[] = columnsResponse.data.columns || [];
        setColumns(allColumns);
        
        // Check if there's a column for this seller
        const sellerColumnExists = allColumns.some(col => col.Field === sellerId);
        
        if (!sellerColumnExists) {
          console.log(`No column found for seller ID: ${sellerId} in allgpt table`);
          setGptMessageIds([]);
          setIsLoading(false);
          return;
        }

        // Fetch rows from the allgpt table
        const rowsResponse = await axios.get(`${NGROK_BASE_URL}/api/db/rows/allgpt`);
        const allRows: AllGptRow[] = rowsResponse.data.rows || [];
        setRows(allRows);
        
        // Extract message IDs for this seller
        const messageIds = allRows
          .filter(row => row[sellerId] !== null && row[sellerId] !== '')
          .map(row => row[sellerId]);
        
        setGptMessageIds(messageIds);
        console.log(`Found ${messageIds.length} GPT messages for seller ID ${sellerId}`);
      } catch (err: any) {
        console.error("Error fetching allgpt data:", err);
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
