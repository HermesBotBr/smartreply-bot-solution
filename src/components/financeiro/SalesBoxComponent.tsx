import React, { useMemo, useEffect } from 'react';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';
import { AdvertisingItem } from '@/hooks/usePublicidadeData';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink } from 'lucide-react';
import ProductThumbnail from '@/components/dashboard/ProductThumbnail';

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
  onRefreshAdvertisingData?: () => void; 
  totalAdvertisingCost: number;
  sellerId?: string;
  onTableTotalsUpdate?: (totals: any) => void; // New prop for table totals
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
  onRefreshAdvertisingData,
  totalAdvertisingCost = 0,
  sellerId,
  onTableTotalsUpdate
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
      individualProfit: number;
      taxAmount: number;
      averageUnitCost: number;
      totalInventoryCost: number;
      advertisingCost: number;
      advertisingSalesUnits: number;
      advertisingProfitPerUnit: number;
      individualProfitMinusAdv: number;
      totalProfitMinusAdv: number;
      projectedTotalProfitMinusAdv: number;
      // New calculated fields for the updated table
      faturadoUnitario: number;
      repasseUnitario: number;
      custoUnitario: number;
      faturadoLiberado: number;
      repasseLiberado: number;
      custoLiberado: number;
      publicidadeUnitario: number;
      publicidadeLiberado: number;
      impostoUnitario: number;
      impostoLiberado: number;
      resultadoTotal: number;
      resultadoLiberado: number;
      resultadoUnitario: number;
      resultadoLiberadoPrevisto: number; // New field for "Resultado /L Previsto"
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
          individualProfit: 0,
          taxAmount: 0,
          averageUnitCost: 0,
          totalInventoryCost: 0,
          advertisingCost: 0,
          advertisingSalesUnits: 0,
          advertisingProfitPerUnit: 0,
          individualProfitMinusAdv: 0,
          totalProfitMinusAdv: 0,
          projectedTotalProfitMinusAdv: 0,
          // Initialize new calculated fields
          faturadoUnitario: 0,
          repasseUnitario: 0,
          custoUnitario: 0,
          faturadoLiberado: 0,
          repasseLiberado: 0,
          custoLiberado: 0,
          publicidadeUnitario: 0,
          publicidadeLiberado: 0,
          impostoUnitario: 0,
          impostoLiberado: 0,
          resultadoTotal: 0,
          resultadoLiberado: 0,
          resultadoUnitario: 0,
          resultadoLiberadoPrevisto: 0, // Initialize new field
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
            item.averageUnitCost = averageUnitCost; // Store for later use in calculating total inventory cost
            
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

    // Calculate new metrics for the three new columns
    itemGroups.forEach(item => {
      // Only calculate for items with data
      if (item.released.count > 0 && item.individualProfit) {
        // Calculate percentage of released units compared to total units
        const releasedPercentage = item.totalUnits > 0 ? item.released.count / item.totalUnits : 0;
        
        // Calculate weighted advertising cost (Publicidade * releasedPercentage)
        const weightedAdvCost = item.advertisingCost * releasedPercentage;
        
        // Calculate advertising cost per released unit
        const advCostPerReleasedUnit = item.released.count > 0 ? weightedAdvCost / item.released.count : 0;
        
        // Calculate individual profit minus advertising (Lucro Individual /L -P)
        item.individualProfitMinusAdv = item.individualProfit - advCostPerReleasedUnit;
        
        // Calculate total profit minus advertising (Lucro Total /L -P)
        item.totalProfitMinusAdv = item.individualProfitMinusAdv * item.released.count;
        
        // Calculate projected total profit (Lucro Total Previsto -P)
        const totalRemainingUnits = item.released.count + item.unreleased.count;
        item.projectedTotalProfitMinusAdv = item.individualProfitMinusAdv * totalRemainingUnits;
      }
    });

    // Calculate total inventory cost
    itemGroups.forEach(item => {
      // Only calculate for items with data
      if (item.averageUnitCost) {
        // Calculate total remaining inventory (Liberado + Não liberado)
        const totalRemainingUnits = item.released.count + item.unreleased.count;
        
        // Calculate total inventory cost
        item.totalInventoryCost = item.averageUnitCost * totalRemainingUnits;
      }
    });

    // Calculate the new fields for the updated table
    itemGroups.forEach(item => {
      // Faturado /U: Valor Unitário Faturado (Faturado /T / Unidades /T)
      item.faturadoUnitario = item.totalUnits > 0 ? item.totalSales / item.totalUnits : 0;
      
      // Faturado /L: Valor Liberado Faturado (estimating as a proportion of total faturado)
      item.faturadoLiberado = item.totalUnits > 0 ? 
        (item.totalSales * item.released.count) / item.totalUnits : 0;
        
      // Repasse /U: Valor Unitário de repasse (Repasse /L / Unidades /L)
      item.repasseUnitario = item.released.count > 0 ? item.released.amount / item.released.count : 0;
      
      // Custo /U: Custo de estoque Unitário (Custo /T / Unidades /T)
      const totalRemainingUnits = item.released.count + item.unreleased.count;
      item.custoUnitario = totalRemainingUnits > 0 && item.totalInventoryCost ? 
        item.totalInventoryCost / totalRemainingUnits : item.averageUnitCost || 0;
      
      // Custo /L: Custo de estoque Liberado (Custo /U * Unidades /L)
      item.custoLiberado = item.custoUnitario * item.released.count;

      // Publicidade /U: Publicidade sobre unidades  
      // (Publicidade /T / (Unidades /T - Unidades /R))
      const nonRefundedUnits = item.totalUnits - item.refunded.count;
      item.publicidadeUnitario = nonRefundedUnits > 0 ? 
        item.advertisingCost / nonRefundedUnits : 0;
      
      // Publicidade /L: Publicidade sobre Liberados (Publicidade /U * Unidades /L)
      item.publicidadeLiberado = item.publicidadeUnitario * item.released.count;
      
      // Imposto /U: Imposto sobre Unidades (Imposto /T / Unidades /T)
      item.impostoUnitario = item.totalUnits > 0 ? item.taxAmount / item.totalUnits : 0;
      
      // Imposto /L: Imposto sobre Liberados (Imposto /U * Unidades /L)
      item.impostoLiberado = item.impostoUnitario * item.released.count;
      
      // Resultado /T: Resultado Total 
      // (Repasse /T - Custo /T - Publicidade /T - Imposto /T)
      item.resultadoTotal = item.totalRepasse - item.totalInventoryCost - 
        item.advertisingCost - item.taxAmount;
      
      // Resultado /L: Resultado Liberado 
      // (Repasse /L - Custo /L - Publicidade /L - Imposto /L)
      item.resultadoLiberado = item.released.amount - item.custoLiberado - 
        item.publicidadeLiberado - item.impostoLiberado;
      
      // Resultado /U: Resultado Unitário 
      // (Repasse /U - Custo /U - Publicidade /U - Imposto /U)
      item.resultadoUnitario = item.repasseUnitario - item.custoUnitario - 
        item.publicidadeUnitario - item.impostoUnitario;
        
      // NEW COLUMN: Resultado /L Previsto
      // Calculated as Resultado /U * (Unidades /L + Unidades /NL)
      item.resultadoLiberadoPrevisto = item.resultadoUnitario * (item.released.count + item.unreleased.count);
    });

    // Convert to array and sort by total sales (descending)
    return Array.from(itemGroups.values())
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [settlementTransactions, releaseOperationsWithOrder, filterBySettlement, inventoryItems, endDate, advertisingItems]);

  // Calculate totals for the footer row
  const tableTotals = useMemo(() => {
    if (!salesByItem.length) return null;
    
    return salesByItem.reduce((totals, item) => {
      return {
        totalUnits: totals.totalUnits + item.totalUnits,
        releasedCount: totals.releasedCount + item.released.count,
        unreleasedCount: totals.unreleasedCount + item.unreleased.count,
        refundedCount: totals.refundedCount + item.refunded.count,
        totalSales: totals.totalSales + item.totalSales,
        faturadoLiberado: totals.faturadoLiberado + item.faturadoLiberado,
        faturadoUnitario: 0, // Not meaningful as an average here
        totalRepasse: totals.totalRepasse + item.totalRepasse,
        releasedAmount: totals.releasedAmount + item.released.amount,
        repasseUnitario: 0, // Not meaningful as an average here
        unreleasedAmount: totals.unreleasedAmount + item.unreleased.amount,
        refundedAmount: totals.refundedAmount + item.refunded.amount,
        totalInventoryCost: totals.totalInventoryCost + (item.totalInventoryCost || 0),
        custoLiberado: totals.custoLiberado + item.custoLiberado,
        custoUnitario: 0, // Not meaningful as an average here
        advertisingCost: totals.advertisingCost + item.advertisingCost,
        publicidadeLiberado: totals.publicidadeLiberado + item.publicidadeLiberado,
        publicidadeUnitario: 0, // Not meaningful as an average here
        taxAmount: totals.taxAmount + item.taxAmount,
        impostoLiberado: totals.impostoLiberado + item.impostoLiberado,
        impostoUnitario: 0, // Not meaningful as an average here
        resultadoTotal: totals.resultadoTotal + item.resultadoTotal,
        resultadoLiberado: totals.resultadoLiberado + item.resultadoLiberado,
        resultadoUnitario: 0, // Not meaningful as an average here
        resultadoLiberadoPrevisto: totals.resultadoLiberadoPrevisto + item.resultadoLiberadoPrevisto,
      };
    }, {
      totalUnits: 0,
      releasedCount: 0,
      unreleasedCount: 0,
      refundedCount: 0,
      totalSales: 0,
      faturadoLiberado: 0,
      faturadoUnitario: 0,
      totalRepasse: 0,
      releasedAmount: 0,
      repasseUnitario: 0,
      unreleasedAmount: 0,
      refundedAmount: 0,
      totalInventoryCost: 0,
      custoLiberado: 0,
      custoUnitario: 0,
      advertisingCost: 0,
      publicidadeLiberado: 0,
      publicidadeUnitario: 0,
      taxAmount: 0,
      impostoLiberado: 0,
      impostoUnitario: 0,
      resultadoTotal: 0,
      resultadoLiberado: 0,
      resultadoUnitario: 0,
      resultadoLiberadoPrevisto: 0,
    });
  }, [salesByItem]);
  
  // Send table totals to parent component when they change
  useEffect(() => {
    if (onTableTotalsUpdate && tableTotals) {
      // Pass the relevant totals back to the parent
      onTableTotalsUpdate({
        totalInventoryCost: tableTotals.totalInventoryCost || 0,
        resultadoLiberado: tableTotals.resultadoLiberado || 0
      });
    }
  }, [tableTotals, onTableTotalsUpdate]);
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Function to get ad link for an item
  const getItemPermalink = (itemId: string) => {
    // First check if the item exists in advertisingItems
    const adItem = advertisingItems.find(ad => ad.item_id === itemId);
    if (adItem?.permalink) {
      return adItem.permalink;
    }
    
    // If not found in advertising items or no permalink, create a default ML link
    return `https://articulo.mercadolibre.com.br/MLB-${itemId.replace('MLB', '')}`;
  };
  
  // Function to open item link in new tab
  const openItemInNewTab = (itemId: string) => {
    const permalink = getItemPermalink(itemId);
    window.open(permalink, '_blank');
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
                  <TableHead>Imagem</TableHead>
                  <TableHead>Anúncio</TableHead>
                  <TableHead className="text-right">Unidades /T</TableHead>
                  <TableHead className="text-right">Unidades /L</TableHead>
                  <TableHead className="text-right">Unidades /NL</TableHead>
                  <TableHead className="text-right">Unidades /R</TableHead>
                  <TableHead className="text-right">Faturado /T</TableHead>
                  <TableHead className="text-right">Faturado /L</TableHead>
                  <TableHead className="text-right">Faturado /U</TableHead>
                  <TableHead className="text-right">Repasse /T</TableHead>
                  <TableHead className="text-right">Repasse /L</TableHead>
                  <TableHead className="text-right">Repasse /U</TableHead>
                  <TableHead className="text-right">Repasse /NL</TableHead>
                  <TableHead className="text-right">Repasse /R</TableHead>
                  <TableHead className="text-right">Custo /T</TableHead>
                  <TableHead className="text-right">Custo /L</TableHead>
                  <TableHead className="text-right">Custo /U</TableHead>
                  <TableHead className="text-right">Publicidade /T</TableHead>
                  <TableHead className="text-right">Publicidade /L</TableHead>
                  <TableHead className="text-right">Publicidade /U</TableHead>
                  <TableHead className="text-right">Imposto /T</TableHead>
                  <TableHead className="text-right">Imposto /L</TableHead>
                  <TableHead className="text-right">Imposto /U</TableHead>
                  <TableHead className="text-right">Resultado /T</TableHead>
                  <TableHead className="text-right">Resultado /L</TableHead>
                  <TableHead className="text-right">Resultado /U</TableHead>
                  <TableHead className="text-right">Resultado /L Previsto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByItem.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="w-12">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => openItemInNewTab(item.itemId)}
                        title="Abrir anúncio em nova guia"
                      >
                        <ProductThumbnail itemId={item.itemId} sellerId={sellerId} />
                      </div>
                    </TableCell>
                    <TableCell 
                      className="font-medium max-w-[200px] truncate cursor-pointer hover:text-blue-600 hover:underline flex items-center" 
                      title={`${item.title} - Clique para abrir o anúncio`}
                      onClick={() => openItemInNewTab(item.itemId)}
                    >
                      <span className="mr-1">{item.title}</span>
                      <ExternalLink size={14} className="inline-block opacity-50" />
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalUnits}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.released.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unreleased.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.refunded.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.faturadoLiberado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.faturadoUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalRepasse)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.released.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.repasseUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unreleased.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.refunded.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalInventoryCost ? formatCurrency(item.totalInventoryCost) : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.custoLiberado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.custoUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.advertisingCost > 0 ? formatCurrency(item.advertisingCost) : "Sem dados"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.publicidadeLiberado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.publicidadeUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.taxAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.impostoLiberado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.impostoUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.resultadoTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.resultadoLiberado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.resultadoUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.resultadoLiberadoPrevisto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {tableTotals && (
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{tableTotals.totalUnits}</TableCell>
                    <TableCell className="text-right">{tableTotals.releasedCount}</TableCell>
                    <TableCell className="text-right">{tableTotals.unreleasedCount}</TableCell>
                    <TableCell className="text-right">{tableTotals.refundedCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.totalSales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.faturadoLiberado)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.totalRepasse)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.releasedAmount)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.unreleasedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.refundedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.totalInventoryCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.custoLiberado)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.advertisingCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.publicidadeLiberado)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.taxAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.impostoLiberado)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.resultadoTotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.resultadoLiberado)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.resultadoLiberadoPrevisto)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
