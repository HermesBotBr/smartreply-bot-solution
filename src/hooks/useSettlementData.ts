
import { useState, useEffect } from 'react';
import axios from 'axios';
import { usePaymentsData } from './usePaymentsData';

interface Payment {
  transaction_amount: number;
  date_approved: string;
  date_created: string; 
  id: number;
  order_id: number;
  status?: string;
  status_detail?: string; // Adicionando campo para identificar reembolsos
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
  isRefunded?: boolean; // Nova propriedade para identificar reembolsos
}


export function useSettlementData(
  sellerId: string | null,
  startDate: Date | undefined,
  endDate: Date | undefined,
  shouldFetch: boolean = true
) {
  const [settlementTransactions, setSettlementTransactions] = useState<SettlementTransaction[]>([]);
  const [refundedTransactions, setRefundedTransactions] = useState<SettlementTransaction[]>([]); // Nova state para operações reembolsadas
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalGrossSales, setTotalGrossSales] = useState(0);
  const [totalNetSales, setTotalNetSales] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalRefundedAmount, setTotalRefundedAmount] = useState(0); // Novo total para reembolsos
  
  // Fetch payment data to get exact repasse values
  const { 
    paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments 
  } = usePaymentsData(sellerId, startDate, endDate, shouldFetch);

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
      const refundedMap = new Map<number, SettlementTransaction>();
      let grossTotal = 0;
      let netTotal = 0;
      let unitsTotal = 0;
      let refundedTotal = 0;

      // First pass: Initialize all orders with their units
      if (response.data && response.data.results) {
        response.data.results.forEach(order => {
          // Get the order ID
          const orderId = order.id;
          
          // Calculate total units from order items (once per order)
          const units = order.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
          
          // Initialize order transaction
          const firstItem = order.order_items?.[0]?.item;
          
          // Verifica se o pedido foi reembolsado
          const isRefunded = order.payments?.some(payment => payment.status_detail === 'bpp_refunded');
          
          // Criar transaction object
          const transaction: SettlementTransaction = {
            date: '',
            sourceId: '',
            orderId: orderId.toString(),
            group: isRefunded ? 'Reembolsado' : 'Venda',
            units,
            grossValue: 0,
            netValue: 0,
            itemId: firstItem?.id || '',
            title: firstItem?.title || '',
            isRefunded
          };

          // Adiciona à coleção apropriada
          if (isRefunded) {
            refundedMap.set(orderId, transaction);
          } else {
            transactionsMap.set(orderId, transaction);
            // Add units to total (only count non-refunded orders)
            unitsTotal += units;
          }
          
          // Process payments for this order
          if (order.payments && order.payments.length > 0) {
            // Somar todos os pagamentos da venda
            const transaction = isRefunded ? refundedMap.get(orderId)! : transactionsMap.get(orderId)!;

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
            
            // Use exact repasse value from payments API if available
            if (paymentsData && paymentsData[orderId.toString()]) {
              transaction.netValue = paymentsData[orderId.toString()];
            } else {
              // Fallback to 70% estimate if not available
              transaction.netValue = totalAmount * 0.7;
            }

            // Adicionar ao total apropriado
            if (isRefunded) {
              refundedTotal += totalAmount;
            } else {
              grossTotal += totalAmount;
              netTotal += transaction.netValue;
            }
          }
        });
      }

      console.log("Processed unique orders:", transactionsMap.size);
      console.log("Processed refunded orders:", refundedMap.size);
      console.log("Financial totals:", { grossTotal, netTotal, unitsTotal, refundedTotal });

      // Convert the maps to arrays of transactions
      const transactions = Array.from(transactionsMap.values());
      const refunded = Array.from(refundedMap.values());
      
      console.log("Transações finais (não reembolsadas):", transactions.length);
      console.log("Transações finais (reembolsadas):", refunded.length);

      setSettlementTransactions(transactions);
      setRefundedTransactions(refunded);
      setTotalGrossSales(grossTotal);
      setTotalNetSales(netTotal);
      setTotalUnits(unitsTotal);
      setTotalRefundedAmount(refundedTotal);
    } catch (err) {
      console.error('Error fetching settlement data from API:', err);
      setError('Falha ao carregar dados de vendas');
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch settlement data when payments data changes
  useEffect(() => {
    if (!paymentsLoading && Object.keys(paymentsData).length > 0) {
      // Update net values based on payments data
      setSettlementTransactions(prev => {
        return prev.map(transaction => {
          if (transaction.orderId && paymentsData[transaction.orderId]) {
            return {
              ...transaction,
              netValue: paymentsData[transaction.orderId]
            };
          }
          return transaction;
        });
      });
      
      // Recalculate total net sales
      const updatedNetTotal = settlementTransactions.reduce(
        (sum, transaction) => sum + transaction.netValue, 
        0
      );
      setTotalNetSales(updatedNetTotal);
    }
  }, [paymentsData, paymentsLoading]);

  useEffect(() => {
    if (shouldFetch && startDate && endDate && sellerId) {
      console.log("Triggering API fetch with dates and sellerId:", startDate, endDate, sellerId);
      fetchData();
      refetchPayments(); // Also fetch payment data
    }
  }, [sellerId, startDate, endDate, shouldFetch]);

  return {
    settlementTransactions,
    refundedTransactions,  // Nova propriedade exportada
    totalGrossSales,
    totalNetSales,
    totalUnits,
    totalRefundedAmount,  // Nova propriedade exportada
    isLoading: isLoading || paymentsLoading,
    error: error || paymentsError,
    refetch: () => {
      fetchData();
      refetchPayments();
    }
  };
}
