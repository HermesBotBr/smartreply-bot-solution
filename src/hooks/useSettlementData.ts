import { useState, useEffect } from 'react';
import axios from 'axios';

interface Payment {
  transaction_amount: number;
  date_approved: string;
  date_created: string; 
  id: number;
  order_id: number;
  status?: string;
}

interface OrderItem {
  quantity: number;
  item: {
    id: string;
    title: string;
  };
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
  itemId?: string;
  title?: string;
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
      const transactionsMap = new Map<number, SettlementTransaction>();
      let grossTotal = 0;
      let netTotal = 0;
      let unitsTotal = 0;

      // First pass: Initialize all orders with their units
      if (response.data && response.data.results) {
        response.data.results.forEach(order => {
          // Get the order ID
          const orderId = order.id;
          
          // Calculate total units from order items (once per order)
          const units = order.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
          
          // Add units to total (count every unique order)
          unitsTotal += units;
          
          // Initialize order transaction
          const firstItem = order.order_items?.[0]?.item;

transactionsMap.set(orderId, {
  date: '',
  sourceId: '',
  orderId: orderId.toString(),
  group: 'Venda',
  units,
  grossValue: 0,
  netValue: 0,
  itemId: firstItem?.id || '',
  title: firstItem?.title || ''
});

          
          // Process payments for this order
          if (order.payments && order.payments.length > 0) {
            // Somar todos os pagamentos da venda
const transaction = transactionsMap.get(orderId)!;

let totalAmount = 0;
let mainPayment: Payment | null = null;

order.payments
  .filter(p => 
    (p.transaction_amount || 0) > 0 &&
    p.status !== 'cancelled' &&
    p.status !== 'rejected'
  )
  .forEach((payment) => {
    const amount = payment.transaction_amount || 0;
    totalAmount += amount;

    if (!mainPayment || amount > (mainPayment.transaction_amount || 0)) {
      mainPayment = payment;
    }
  });




if (mainPayment) {
  transaction.date = mainPayment.date_approved || mainPayment.date_created || new Date().toISOString();
  transaction.sourceId = mainPayment.id.toString();
}

transaction.grossValue = totalAmount;
transaction.netValue = totalAmount * 0.7;

grossTotal += totalAmount;
netTotal += totalAmount * 0.7;


          }

        });
      }

      console.log("Processed unique orders:", transactionsMap.size);
      console.log("Financial totals:", { grossTotal, netTotal, unitsTotal });

      // Convert the map to an array of transactions
      // Include ALL transactions, not just ones with gross value > 0
      const transactions = Array.from(transactionsMap.values());
      
console.log("Transações finais:", transactions);

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
