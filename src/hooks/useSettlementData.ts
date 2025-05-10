
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Payment {
  transaction_amount: number;
  date_approved: string;
  id: number;
  order_id: number;
}

interface OrderItem {
  quantity: number;
}

interface SalesResult {
  payments: Payment[];
  order_items: OrderItem[];
  id: number;
}

interface SalesResponse {
  results: SalesResult[];
}

export interface SettlementTransaction {
  date: string;
  sourceId: string;
  orderId: string;
  group: string;
  units: number;
  grossValue: number;
  netValue: number;
}

export function useSettlementData(
  sellerId: string | null,
  startDate: Date | undefined,
  endDate: Date | undefined,
  shouldFetch: boolean = true
) {
  const [settlementTransactions, setSettlementTransactions] = useState<SettlementTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalGrossSales, setTotalGrossSales] = useState(0);
  const [totalNetSales, setTotalNetSales] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);

  const fetchData = async () => {
    if (!sellerId || !startDate || !endDate) {
      console.log("Missing parameters for fetchData:", { sellerId, startDate, endDate });
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

      console.log(`Fetching settlement data for seller ${sellerId} with date range: ${formattedStartDate} to ${formattedEndDate}`);

      const response = await axios.get<SalesResponse>(`https://projetohermes-dda7e0c8d836.herokuapp.com/vendas_adm`, {
        params: {
          seller_id: sellerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }
      });

      console.log("API Response:", response.data);

      // Process the API response
      const transactions: SettlementTransaction[] = [];
      let grossTotal = 0;
      let netTotal = 0;
      let unitsTotal = 0;

      if (response.data && response.data.results) {
        response.data.results.forEach(order => {
          if (order.payments && order.payments.length > 0) {
            // Calculate total units from order items
            const units = order.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
            unitsTotal += units;

            // Process each payment
            order.payments.forEach(payment => {
              const transactionAmount = payment.transaction_amount || 0;
              grossTotal += transactionAmount;
              
              // As we don't have netValue in the API response, we're estimating it as 70% of gross
              // This is just a placeholder, you should adjust this based on actual commission rates
              const netValue = transactionAmount * 0.7;
              netTotal += netValue;

              transactions.push({
                date: payment.date_approved,
                sourceId: payment.id.toString(),
                orderId: order.id.toString(),
                group: 'Venda',
                units: units,
                grossValue: transactionAmount,
                netValue: netValue
              });
            });
          }
        });
      }

      console.log("Processed transactions:", transactions.length);
      console.log("Financial totals:", { grossTotal, netTotal, unitsTotal });

      setSettlementTransactions(transactions);
      setTotalGrossSales(grossTotal);
      setTotalNetSales(netTotal);
      setTotalUnits(unitsTotal);
    } catch (err) {
      console.error('Error fetching settlement data from API:', err);
      setError('Falha ao carregar dados de vendas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch && startDate && endDate && sellerId) {
      console.log("Triggering API fetch with dates and sellerId:", startDate, endDate, sellerId);
      fetchData();
    }
  }, [sellerId, startDate, endDate, shouldFetch]);

  return {
    settlementTransactions,
    totalGrossSales,
    totalNetSales,
    totalUnits,
    isLoading,
    error,
    refetch: fetchData
  };
}
