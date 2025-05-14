
import React, { useMemo } from 'react';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesBoxComponentProps {
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  totalMLRepasses: number;
  totalMLFees: number;
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;  // New prop for filtering by settlement
}

export const SalesBoxComponent: React.FC<SalesBoxComponentProps> = ({
  settlementTransactions,
  releaseOperationsWithOrder,
  totalMLRepasses,
  totalMLFees,
  startDate,
  endDate,
  filterBySettlement = false,  // Default to false
}) => {
  const salesByItem = useMemo(() => {
    if (!settlementTransactions.length) return [];

    // Create set of order IDs from settlement for quick lookup when filtering
    const settlementOrderIds = new Set(
      settlementTransactions.map(transaction => transaction.orderId)
    );

    // Group transactions by item ID
    const itemGroups = new Map<string, {
      itemId: string;
      title: string;
      totalSales: number;
      totalUnits: number;
      totalRepasse: number;
      totalFees: number;
      released: {
        count: number;
        amount: number;
      };
      unreleased: {
        count: number;
        amount: number;
      };
    }>();

    // Process settlement transactions (all sales)
    settlementTransactions.forEach(transaction => {
      if (!transaction.itemId) return;

      if (!itemGroups.has(transaction.itemId)) {
        itemGroups.set(transaction.itemId, {
          itemId: transaction.itemId,
          title: transaction.title || 'Produto sem título',
          totalSales: 0,
          totalUnits: 0,
          totalRepasse: 0,
          totalFees: 0,
          released: { count: 0, amount: 0 },
          unreleased: { count: 0, amount: 0 }
        });
      }

      const item = itemGroups.get(transaction.itemId)!;
      item.totalSales += transaction.grossValue;
      item.totalUnits += transaction.units;
      
      // Calculate repasse (70% of gross value as a simple approximation)
      const repasse = transaction.netValue;
      item.totalRepasse += repasse;
      
      // Calculate fees (30% of gross value as a simple approximation)
      const fees = transaction.grossValue - repasse;
      item.totalFees += fees;
    });

    // Process release operations (released amounts)
    const processedOrderIds = new Set<string>();
    releaseOperationsWithOrder.forEach(operation => {
      if (!operation.orderId || !operation.itemId) return;
      
      // Skip if we've already processed this order
      if (processedOrderIds.has(operation.orderId)) return;
      
      // If filtering by settlement is enabled, only process orders that exist in settlement transactions
      if (filterBySettlement && !settlementOrderIds.has(operation.orderId)) return;
      
      processedOrderIds.add(operation.orderId);

      const item = itemGroups.get(operation.itemId);
      if (item) {
        item.released.count += 1;
        item.released.amount += operation.amount;
      }
    });

    // Calculate unreleased amounts (totalSales - releasedAmount)
    itemGroups.forEach(item => {
      const totalOrderValue = item.totalRepasse; // Use repasse value as this is what gets released
      const releasedAmount = item.released.amount;
      
      // Calculate unreleased amount (exact calculation)
      if (releasedAmount < totalOrderValue) {
        const unreleasedAmount = totalOrderValue - releasedAmount;
        
        // Calculate unreleased count (exact calculation)
        // Instead of estimating, we directly subtract released count from total units
        item.unreleased.amount = unreleasedAmount;
        item.unreleased.count = item.totalUnits - item.released.count;
      } else {
        // If everything is released, set unreleased to 0
        item.unreleased.amount = 0;
        item.unreleased.count = 0;
      }
    });

    // Convert to array and sort by total sales (descending)
    return Array.from(itemGroups.values())
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [settlementTransactions, releaseOperationsWithOrder, filterBySettlement]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Vendas por Anúncio</CardTitle>
      </CardHeader>
      <CardContent>
        {salesByItem.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anúncio</TableHead>
                  <TableHead className="text-right">Vendas Totais</TableHead>
                  <TableHead className="text-right">Repasse Total</TableHead>
                  <TableHead className="text-right">Taxas (ML)</TableHead>
                  <TableHead className="text-right">Liberado</TableHead>
                  <TableHead className="text-right">Não Liberado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByItem.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={item.title}>
                      {item.title}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalSales)} <span className="text-xs text-gray-500">({item.totalUnits} un.)</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalRepasse)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalFees)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.released.amount)} <span className="text-xs text-gray-500">({item.released.count} un.)</span>
                      {filterBySettlement && <span className="text-xs text-blue-500 ml-1">(filtrado)</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unreleased.amount)} <span className="text-xs text-gray-500">({item.unreleased.count} un.)</span>
                      {filterBySettlement && <span className="text-xs text-blue-500 ml-1">(filtrado)</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
