import { useState, useEffect } from 'react';
import axios from 'axios';

interface Payment {
  transaction_amount: number;
  date_approved: string;
  id: number;
  order_id: number;
  status: string;
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
      // Group transactions by order_id to avoid duplicating amounts
      const orderMap = new Map<string, {
        date: string,
        units: number,
        grossValue: number,
        netValue: number,
        sourceIds: string[],
        orderId: string
      }>();
      
      let grossTotal = 0;
      let netTotal = 0;
      let unitsTotal = 0;

      if (response.data && response.data.results) {
        response.data.results.forEach(order => {
          // Calculate total units from order items (once per order)
          const units = order.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
          
          // Get approved payments only
          const approvedPayments = order.payments?.filter(payment => payment.status === 'approved') || [];
          
          if (approvedPayments.length > 0) {
            const orderId = order.id.toString();
            
            // If this is the first time we're seeing this order, add it to our map
            if (!orderMap.has(orderId)) {
              // Get most recent payment date
              const mostRecentPayment = approvedPayments.reduce((latest, payment) => {
                if (!latest.date_approved) return payment;
                return new Date(payment.date_approved) > new Date(latest.date_approved) ? payment : latest;
              }, approvedPayments[0]);
              
              const date = mostRecentPayment.date_approved || '';
              
              // Sum up all transaction amounts for this order
              const totalGrossValue = approvedPayments.reduce((sum, payment) => sum + (payment.transaction_amount || 0), 0);
              
              // As we don't have netValue in the API response, we're estimating it as 70% of gross
              const totalNetValue = totalGrossValue * 0.7;
              
              // Keep track of all source IDs for this order
              const sourceIds = approvedPayments.map(payment => payment.id.toString());
              
              orderMap.set(orderId, {
                date,
                units,
                grossValue: totalGrossValue,
                netValue: totalNetValue,
                sourceIds,
                orderId
              });
              
              // Add to our totals (only once per order)
              grossTotal += totalGrossValue;
              netTotal += totalNetValue;
              unitsTotal += units;
            }
          }
        });
      }

      // Convert our map to the settlement transactions array
      const transactions: SettlementTransaction[] = [];
      orderMap.forEach(orderData => {
        // Use the first source ID for display purposes
        const primarySourceId = orderData.sourceIds[0] || '';
        
        transactions.push({
          date: orderData.date,
          sourceId: primarySourceId,
          orderId: orderData.orderId,
          group: 'Venda',
          units: orderData.units,
          grossValue: orderData.grossValue,
          netValue: orderData.netValue
        });
      });

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
