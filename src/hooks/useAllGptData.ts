
import { useState, useEffect } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

interface AllGptQuestion {
  question_id: string;
  seller_id: string;
}

export function useAllGptData(sellerId: string | null) {
  const [gptQuestionIds, setGptQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllGptData = async () => {
      if (!sellerId) {
        setGptQuestionIds([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch rows from the allgpt_perguntas table
        const response = await axios.get(`${NGROK_BASE_URL}/api/db/rows/allgpt_perguntas`);
        const allRows: AllGptQuestion[] = response.data.rows || [];
        
        // Filter for questions that belong to this seller
        const questionIds = allRows
          .filter(row => row.seller_id === sellerId)
          .map(row => row.question_id);
        
        setGptQuestionIds(questionIds);
        console.log(`Found ${questionIds.length} GPT-answered questions for seller ID ${sellerId}`);
      } catch (err: any) {
        console.error("Error fetching allgpt_perguntas data:", err);
        setError("Erro ao buscar dados da tabela allgpt_perguntas");
        setGptQuestionIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllGptData();
  }, [sellerId]);

  return { gptQuestionIds, isLoading, error };
}
