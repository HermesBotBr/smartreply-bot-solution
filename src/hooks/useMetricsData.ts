
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';

export interface MetricsData {
  summary: {
    totalMessages: number;
    totalQuestions: number;
    complaintsAvoided: number;
    unpreventedComplaints: number;
    totalRevenue: number;
  };
  messageData: {
    date: string;
    total: number;
    automated: number;
  }[];
  questionData: {
    date: string;
    received: number;
    answered: number;
  }[];
  salesData: {
    date: string;
    value: number;
  }[];
  productCategories: {
    name: string;
    value: number;
  }[];
}

export function useMetricsData(complaintsAvoided: number, unpreventedComplaints: number) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateData = async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString('pt-BR');
      }).reverse();

      const messageData = days.map(day => ({
        date: day,
        total: Math.floor(Math.random() * 30) + 5,
        automated: Math.floor(Math.random() * 20) + 5
      }));

      const questionData = days.map(day => ({
        date: day,
        received: Math.floor(Math.random() * 15) + 1,
        answered: Math.floor(Math.random() * 10) + 1
      }));

      const salesData = days.map(day => ({
        date: day,
        value: Math.floor(Math.random() * 5000) + 1000
      }));

      const productCategories = [
        { name: 'Eletrônicos', value: Math.floor(Math.random() * 45) + 10 },
        { name: 'Casa', value: Math.floor(Math.random() * 30) + 10 },
        { name: 'Roupas', value: Math.floor(Math.random() * 25) + 5 },
        { name: 'Esporte', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'Outros', value: Math.floor(Math.random() * 15) + 5 }
      ];

      const gptResponse = await fetch(getNgrokUrl('all_gpt.txt'));
      const gptText = await gptResponse.text();
      const gptIds = gptText.split('\n').filter(line => line.trim() !== '');
      const totalMessagesCount = gptIds.length;

      const fakeData = {
        summary: {
          totalMessages: totalMessagesCount,
          totalQuestions: questionData.reduce((acc, curr) => acc + curr.received, 0),
          complaintsAvoided: complaintsAvoided,
          unpreventedComplaints: unpreventedComplaints,
          totalRevenue: salesData.reduce((acc, curr) => acc + curr.value, 0)
        },
        messageData,
        questionData,
        salesData,
        productCategories
      };

      setMetrics(fakeData);
      setLoading(false);
    };

    setTimeout(generateData, 1500);
  }, [complaintsAvoided, unpreventedComplaints]);

  return { metrics, loading };
}
