
import React, { useMemo } from 'react';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';
import { AdvertisingItem } from '@/hooks/usePublicidadeData';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SalesBoxComponentProps {
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  totalMLRepasses: number;
  totalMLFees: number;
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;
  inventoryItems?: InventoryItem[];
  advertisingItems?: AdvertisingItem[];
  totalAdvertisingCost: number;
  onRefreshAdvertisingData?: () => void;
}

export const SalesBoxComponent: React.FC<SalesBoxComponentProps> = ({
  settlementTransactions,
  releaseOperationsWithOrder,
  totalMLRepasses,
  totalMLFees,
  startDate,
  endDate,
  filterBySettlement = false,
  inventoryItems = [],
  advertisingItems = [],
  totalAdvertisingCost = 0,
  onRefreshAdvertisingData
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
      refunded: {
        count: number;
        amount: number;
      };
      individualProfit: number; // Added field for individual profit
      taxAmount: number; // Added field for tax amount
      advertisingCost: number; // Added field for advertising cost
      advertisingSalesUnits: number; // Added field for advertising sales units
      advertisingProfitPerUnit: number; // Added field for profit per unit from advertising
      individualProfitMinusAd: number; // New field for individual profit - advertising
      totalProfitMinusAd: number; // New field for total profit - advertising
      totalExpectedProfitMinusAd: number; // New field for total expected profit - advertising
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
          unreleased: { count: 0, amount: 0 },
          refunded: { count: 0, amount: 0 },
          individualProfit: 0, // Initialize individual profit
          taxAmount: 0, // Initialize tax amount
          advertisingCost: 0, // Initialize advertising cost
          advertisingSalesUnits: 0, // Initialize advertising sales units
          advertisingProfitPerUnit: 0, // Initialize advertising profit per unit
          individualProfitMinusAd: 0, // Initialize individual profit - advertising
          totalProfitMinusAd: 0, // Initialize total profit - advertising
          totalExpectedProfitMinusAd: 0, // Initialize total expected profit - advertising
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
      
      // Calculate tax amount (10% of total sales)
      item.taxAmount = item.totalSales * 0.1;
    });

    // Calculate individual profit based on inventory data
    itemGroups.forEach(item => {
      // Check if we have released units and inventory data for this item
      if (item.released.count > 0 && item.released.amount > 0) {
        // Find matching inventory item
        const inventoryItem = inventoryItems.find(invItem => invItem.itemId === item.itemId);
        
        if (inventoryItem) {
          // Calculate the per-unit value of released amount
          const unitReleaseValue = item.released.amount / item.released.count;
          
          // Get the purchase history for this item
          const { purchases } = inventoryItem;
          
          // Filter purchases that occurred before or on the end date of analysis
          const filteredPurchases = endDate 
            ? purchases.filter(purchase => {
                if (!purchase.date) return true; // Include purchases without dates
                
                // Parse the Brazilian date format (DD/MM/YYYY)
                const parts = purchase.date.split('/');
                const purchaseDate = new Date(
                  parseInt(parts[2]), // Year
                  parseInt(parts[1]) - 1, // Month (0-indexed)
                  parseInt(parts[0]) // Day
                );
                
                // Keep purchases before or on the end date
                return purchaseDate <= endDate;
              })
            : purchases;
          
          // Sort purchases by date (newest first)
          const sortedPurchases = [...filteredPurchases].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return -1 * compareBrazilianDates(a.date, b.date); // -1 to reverse order
          });
          
          // Calculate the weighted average cost of the last X units (where X = released count)
          let remainingUnits = item.released.count;
          let totalCost = 0;
          let consideredUnits = 0;
          
          for (const purchase of sortedPurchases) {
            const unitsToConsider = Math.min(purchase.quantity, remainingUnits);
            
            if (unitsToConsider <= 0) break;
            
            totalCost += unitsToConsider * purchase.unitCost;
            consideredUnits += unitsToConsider;
            remainingUnits -= unitsToConsider;
            
            if (remainingUnits <= 0) break;
          }
          
          // Calculate the average unit cost and individual profit
          if (consideredUnits > 0) {
            const averageUnitCost = totalCost / consideredUnits;
            
            // Calculate tax per unit (tax amount / total units)
            const taxPerUnit = item.totalUnits > 0 ? item.taxAmount / item.totalUnits : 0;
            
            // Adjust individual profit to subtract the tax per unit
            item.individualProfit = unitReleaseValue - averageUnitCost - taxPerUnit;
          }
        }
      }
    });

    // Add advertising data to each item
    itemGroups.forEach(item => {
      // Find matching advertising item
      const adItem = advertisingItems.find(ad => ad.item_id === item.itemId);
      
      if (adItem) {
        // Add advertising cost and sales units
        item.advertisingCost = adItem.metrics.cost || 0;
        item.advertisingSalesUnits = adItem.metrics.direct_units_quantity || 0;
        
        // Calculate advertising profit per unit
        if (item.advertisingSalesUnits > 0 && item.advertisingCost > 0) {
          // Calculate advertising cost per unit
          const adCostPerUnit = item.advertisingCost / item.advertisingSalesUnits;
          
          // Calculate profit per unit from advertising sales
          // Formula: (Lucro Individual /L) - (Valor da coluna "Publicidade" / Unidades da coluna "Publicidade")
          item.advertisingProfitPerUnit = item.individualProfit - adCostPerUnit;
        }
      }
    });

    // Calculate new columns for each item
    itemGroups.forEach(item => {
      // Only calculate if we have the required data
      if (item.individualProfit && item.totalUnits > 0 && item.released.count > 0) {
        // 1. Lucro Individual /L -P
        // Primeiro, deve-se coletar o valor da porcentagem das unidades de vendas liberadas em relação as unidades das vendas totais
        const releasedPercentage = item.released.count / item.totalUnits;
        
        // (Valor da coluna "Publicidade * releasedPercentage) = X
        const adjustedAdCost = item.advertisingCost * releasedPercentage;
        
        // X / Unidades Liberadas = Y
        const adCostPerReleasedUnit = item.released.count > 0 ? adjustedAdCost / item.released.count : 0;
        
        // (Valor da coluna "Lucro Individual /L") - Y = "Lucro Individual /L -P"
        item.individualProfitMinusAd = item.individualProfit - adCostPerReleasedUnit;
        
        // 2. Lucro Total /L -P
        // Multiplicar o valor de "Lucro Individual /L -P" pelas unidades da coluna "Liberado"
        item.totalProfitMinusAd = item.individualProfitMinusAd * item.released.count;
        
        // 3. Lucro Total Previsto -P
        // (Unidades da coluna "Liberado" + Unidades da coluna "Não Liberado") * Lucro Individual /L -P
        const totalUnitsExpected = item.released.count + item.unreleased.count;
        item.totalExpectedProfitMinusAd = item.individualProfitMinusAd * totalUnitsExpected;
      }
    });

    // Convert to array and sort by total sales (descending)
    return Array.from(itemGroups.values())
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [settlementTransactions, releaseOperationsWithOrder, filterBySettlement, inventoryItems, endDate, advertisingItems]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Vendas por Anúncio</CardTitle>
        {onRefreshAdvertisingData && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefreshAdvertisingData} 
            title="Atualizar dados de publicidade"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
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
                  <TableHead className="text-right">Imposto</TableHead>
                  <TableHead className="text-right">Publicidade</TableHead>
                  <TableHead className="text-right">Lucro indiv. vendas pub.</TableHead>
                  <TableHead className="text-right">Lucro Individual /L</TableHead>
                  <TableHead className="text-right">Lucro Individual /L -P</TableHead>
                  <TableHead className="text-right">Lucro Total /L -P</TableHead>
                  <TableHead className="text-right">Lucro Total Previsto -P</TableHead>
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
                      {formatCurrency(item.taxAmount)} <span className="text-xs text-gray-500">(10%)</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.advertisingCost > 0 
                        ? <>
                            {formatCurrency(item.advertisingCost)} <span className="text-xs text-gray-500">({item.advertisingSalesUnits} un.)</span>
                          </>
                        : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.advertisingSalesUnits > 0 && item.advertisingProfitPerUnit !== 0
                        ? formatCurrency(item.advertisingProfitPerUnit)
                        : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.individualProfit ? formatCurrency(item.individualProfit) : "Sem dados"}
                    </TableCell>
                    {/* New columns */}
                    <TableCell className="text-right">
                      {item.individualProfitMinusAd ? formatCurrency(item.individualProfitMinusAd) : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalProfitMinusAd ? formatCurrency(item.totalProfitMinusAd) : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalExpectedProfitMinusAd ? formatCurrency(item.totalExpectedProfitMinusAd) : "Sem dados"}
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
