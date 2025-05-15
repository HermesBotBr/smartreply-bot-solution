
import React, { useMemo } from 'react';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';

interface SalesBoxComponentProps {
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  totalMLRepasses: number;
  totalMLFees: number;
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;
  inventoryItems?: InventoryItem[]; // New prop to receive inventory data
}

export const SalesBoxComponent: React.FC<SalesBoxComponentProps> = ({
  settlementTransactions,
  releaseOperationsWithOrder,
  totalMLRepasses,
  totalMLFees,
  startDate,
  endDate,
  filterBySettlement = false,
  inventoryItems = [], // Default to empty array
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
      unitProfit: number; // New field for unit profit
      released: {
        count: number;
        amount: number;
      };
      unreleased: {
        count: number;
        amount: number;
      };
      refunded: {
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
          unitProfit: 0,
          released: { count: 0, amount: 0 },
          unreleased: { count: 0, amount: 0 },
          refunded: { count: 0, amount: 0 }
        });
      }

      const item = itemGroups.get(transaction.itemId)!;
      
      // Add to totals (even if refunded - we'll handle that separately)
      item.totalSales += transaction.grossValue;
      item.totalUnits += transaction.units;
      
      // Calculate repasse and fees
      const repasse = transaction.netValue;
      item.totalRepasse += repasse;
      
      const fees = transaction.grossValue - repasse;
      item.totalFees += fees;
      
      // If it's a refunded transaction, add to refunded counts
      if (transaction.isRefunded) {
        item.refunded.count += transaction.units;
        item.refunded.amount += repasse;
      }
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

    // Calculate unreleased amounts (totalRepasse - releasedAmount - refundedAmount)
    itemGroups.forEach(item => {
      const totalOrderValue = item.totalRepasse; // Use repasse value as this is what gets released
      const releasedAmount = item.released.amount;
      const refundedAmount = item.refunded.amount;
      
      // Calculate unreleased amount, excluding refunded transactions
      if (releasedAmount < (totalOrderValue - refundedAmount)) {
        const unreleasedAmount = totalOrderValue - releasedAmount - refundedAmount;
        
        // Calculate unreleased count
        item.unreleased.amount = unreleasedAmount;
        item.unreleased.count = item.totalUnits - item.released.count - item.refunded.count;
      } else {
        // If everything is released or refunded, set unreleased to 0
        item.unreleased.amount = 0;
        item.unreleased.count = 0;
      }
    });

    // Calculate unit profit for each item based on inventory data and released sales
    if (inventoryItems && inventoryItems.length > 0 && endDate) {
      itemGroups.forEach(item => {
        // Only calculate profit if there are released units
        if (item.released.count > 0) {
          // Find the corresponding inventory item
          const inventoryItem = inventoryItems.find(invItem => invItem.itemId === item.itemId);
          
          if (inventoryItem) {
            // Calculate repasse per unit
            const repassePerUnit = item.released.amount / item.released.count;
            
            // Sort purchases by date (oldest first) to properly calculate costs
            const sortedPurchases = [...inventoryItem.purchases]
              .sort((a, b) => compareBrazilianDates(a.date, b.date));
            
            // Filter purchases by end date (only consider purchases made before or on the end date)
            const validPurchases = sortedPurchases.filter(purchase => {
              if (!purchase.date || !endDate) return true;
              
              // Parse the purchase date
              const [day, month, year] = purchase.date.split('/').map(Number);
              const purchaseDate = new Date(year, month - 1, day);
              
              // Compare with end date
              return purchaseDate <= endDate;
            });
            
            // Calculate weighted average cost for the released units
            let remainingUnitsNeeded = item.released.count;
            let totalCost = 0;
            
            for (const purchase of validPurchases) {
              if (remainingUnitsNeeded <= 0) break;
              
              const unitsFromThisPurchase = Math.min(purchase.quantity, remainingUnitsNeeded);
              totalCost += unitsFromThisPurchase * purchase.unitCost;
              remainingUnitsNeeded -= unitsFromThisPurchase;
            }
            
            // If we have enough purchase data to calculate average cost
            if (remainingUnitsNeeded <= 0) {
              const averageCost = totalCost / item.released.count;
              item.unitProfit = repassePerUnit - averageCost;
            }
          }
        }
      });
    }

    // Convert to array and sort by total sales (descending)
    return Array.from(itemGroups.values())
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [settlementTransactions, releaseOperationsWithOrder, filterBySettlement, inventoryItems, endDate]);

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
                  <TableHead className="text-right">Reembolsadas</TableHead>
                  <TableHead className="text-right">Lucro Individual /L</TableHead>
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
                    <TableCell className="text-right">
                      {formatCurrency(item.refunded.amount)} <span className="text-xs text-gray-500">({item.refunded.count} un.)</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unitProfit ? (
                        <span className={item.unitProfit < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(item.unitProfit)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Não calculado</span>
                      )}
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
