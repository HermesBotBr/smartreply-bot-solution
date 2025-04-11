
import { useState, useEffect } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

export function useHermesAnswers(sellerId: string | null) {
  const [hermesQuestionIds, setHermesQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHermesQuestions = async () => {
      if (!sellerId) {
        setHermesQuestionIds([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${NGROK_BASE_URL}/api/db/rows/allgpt_perguntas`);
        const allRows = response.data.rows || [];
        
        // Filter rows for this seller and extract question IDs
        const sellerQuestionIds = allRows
          .filter((row: any) => row.seller_id === sellerId)
          .map((row: any) => row.question_id);
        
        setHermesQuestionIds(sellerQuestionIds);
        console.log(`Found ${sellerQuestionIds.length} Hermes-answered questions for seller ID ${sellerId}`);
      } catch (err: any) {
        console.error("Error fetching Hermes answers data:", err);
        setError("Erro ao buscar perguntas respondidas pelo Hermes");
        setHermesQuestionIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHermesQuestions();
  }, [sellerId]);

  return { hermesQuestionIds, isLoading, error };
}
