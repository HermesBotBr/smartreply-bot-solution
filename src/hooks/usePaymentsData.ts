
import { useState, useEffect } from 'react';
import axios from 'axios';

export interface PaymentData {
  id_pagamento: number;
  status: string;
  nome_do_anuncio: string;
  unidades: number;
  valor_total: number;
  transacao_reembolsada: boolean;
  data_aprovada: string;
  collector_id: number;
  order_id: string;
  shipping_id: number | null;
  item_id: string;
  valor_taxas: number;
  valor_envio: number;
  valor_repasse: number;
}

interface PaymentsResponse {
  status: string;
  quantidade: number;
  pagamentos: PaymentData[];
}

export function usePaymentsData(
  sellerId: string | null,
  startDate: Date | undefined,
  endDate: Date | undefined,
  shouldFetch: boolean = true
) {
  const [paymentsData, setPaymentsData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!sellerId || !startDate || !endDate) {
      console.log("Missing parameters for fetchPaymentsData:", { sellerId, startDate, endDate });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Format dates for the API (DD/MM/YYYY)
      const formatDateForApi = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const formattedStartDate = formatDateForApi(startDate);
      const formattedEndDate = formatDateForApi(endDate);

      console.log(`Fetching payment data for seller ${sellerId} with date range: ${formattedStartDate} to ${formattedEndDate}`);

      const response = await axios.post<PaymentsResponse>(
        `https://projetohermes-dda7e0c8d836.herokuapp.com/pagamentos_adm`,
        {
          seller_id: sellerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }
      );

      console.log("Payments API Response:", response.data);

      // Create a map of order_id to valor_repasse
      const paymentsMap: Record<string, number> = {};
      if (response.data && response.data.pagamentos) {
        response.data.pagamentos.forEach(payment => {
          if (payment.order_id && payment.valor_repasse) {
            paymentsMap[payment.order_id] = payment.valor_repasse;
          }
        });
      }

      console.log("Processed payments data:", paymentsMap);
      setPaymentsData(paymentsMap);
    } catch (err) {
      console.error('Error fetching payment data from API:', err);
      setError('Falha ao carregar dados de pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch && startDate && endDate && sellerId) {
      console.log("Triggering payment API fetch with dates and sellerId:", startDate, endDate, sellerId);
      fetchData();
    }
  }, [sellerId, startDate, endDate, shouldFetch]);

  return {
    paymentsData,
    isLoading,
    error,
    refetch: fetchData
  };
}
