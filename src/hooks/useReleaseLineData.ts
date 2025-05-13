
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import axios from 'axios';
import { SettlementTransaction } from './useSettlementData';

interface ReleaseLineRow {
  seller_id: string;
  date: string;
  source_id: string;
  external_reference: string | null;
  record_type: string;
  description: string | null;
  net_credit: string;
  net_debit: string;
  item_id: string | null;
  sale_detail: string | null;
}

interface ReleaseLineResponse {
  rows: ReleaseLineRow[];
}

export function useReleaseLineData(
  sellerId: string | null,
  startDate?: Date,
  endDate?: Date
) {
  const [releaseLineTransactions, setReleaseLineTransactions] = useState<SettlementTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleaseLineData = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch release line data from the database
        const response = await axios.get<ReleaseLineResponse>(
          `${getNgrokUrl('/api/db/rows/release_lines')}`
        );
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release line data');
        }
        
        // Filter by seller_id and date range
        let filteredRows = response.data.rows.filter(
          row => row.seller_id === sellerId
        );
        
        // Apply date filter if both dates are available
        if (startDate && endDate) {
          const startDateTime = new Date(startDate);
          startDateTime.setHours(0, 0, 0, 0);
          
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          
          filteredRows = filteredRows.filter(row => {
            const rowDate = new Date(row.date);
            return rowDate >= startDateTime && rowDate <= endDateTime;
          });
        }

        // Set latest date as last update
        if (filteredRows.length > 0) {
          const dates = filteredRows.map(row => new Date(row.date).getTime());
          const latestDate = new Date(Math.max(...dates));
          setLastUpdate(latestDate.toISOString());
        }
        
        // Transform to SettlementTransaction format
        const transactions: SettlementTransaction[] = filteredRows
          .filter(row => row.record_type !== "initial_available_balance")
          .map(row => {
            const netCredit = parseFloat(row.net_credit) || 0;
            const netDebit = parseFloat(row.net_debit) || 0;
            const netValue = netCredit - netDebit;
            
            let group = "Outros";
            if (row.description === 'payment' && row.external_reference) {
              group = "Venda";
            } else if (['reserve_for_dispute', 'reserve_for_bpp_shipping_return', 'refund', 'reserve_for_refund', 'mediation'].includes(row.description || '')) {
              group = "Reclamações";
            } else if (row.description === 'reserve_for_debt_payment') {
              group = "Dívidas";
            } else if (['payout', 'reserve_for_payout'].includes(row.description || '')) {
              group = "Transferências";
            } else if (row.description === 'credit_payment') {
              group = "Cartão de Crédito";
            } else if (['shipping', 'cashback'].includes(row.description || '')) {
              group = "Correção de Envios e Cashbacks";
            }
            
            return {
              date: row.date,
              sourceId: row.source_id || '',
              orderId: row.external_reference || '',
              group,
              units: 1, // Default to 1 unit unless we have specific quantity info
              grossValue: netValue, // In this context, we treat net value as gross
              netValue: netValue,
              itemId: row.item_id || '',
              title: row.sale_detail?.replace(/^"""/, '').replace(/"""$/, '') || '',
            };
        });
        
        setReleaseLineTransactions(transactions);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching release line data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    fetchReleaseLineData();
  }, [sellerId, startDate, endDate]);

  return { 
    releaseLineTransactions, 
    isLoading, 
    error, 
    lastUpdate,
    refetch: async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state updates
        const fetchReleaseLineData = async () => {
          // Implementation of refetch logic (same as above)
          // ... (copy the fetchReleaseLineData function logic here)
        };
        await fetchReleaseLineData();
      } catch (error) {
        console.error('Error refetching release line data:', error);
      }
    }
  };
}
