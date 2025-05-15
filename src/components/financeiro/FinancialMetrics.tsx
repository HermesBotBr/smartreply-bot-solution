
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from '@/components/dashboard/metrics/MetricCard';
import { SalesBoxComponent } from './SalesBoxComponent';
import { RepassesPopup } from './RepassesPopup';
import { ReleasePopup } from './ReleasePopup';
import { ClaimsPopup } from './ClaimsPopup';
import { TransfersPopup } from './TransfersPopup';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { InventoryItem } from '@/types/inventory';

interface FinancialMetricsProps {
  grossSales: number;
  totalAmount: number;
  unitsSold: number;
  totalMLRepasses: number;
  totalMLFees: number;
  totalReleased: number;
  totalClaims: number;
  totalDebts: number;
  totalTransfers: number;
  totalCreditCard: number;
  totalShippingCashback: number;
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  releaseOtherOperations: ReleaseOperation[];
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;
  inventoryItems?: InventoryItem[];
  onRefreshInventory?: () => Promise<void>; // New prop for refreshing inventory
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({
  grossSales,
  totalAmount,
  unitsSold,
  totalMLRepasses,
  totalMLFees,
  totalReleased,
  totalClaims,
  totalDebts,
  totalTransfers,
  totalCreditCard,
  totalShippingCashback,
  settlementTransactions,
  releaseOperationsWithOrder,
  releaseOtherOperations,
  startDate,
  endDate,
  filterBySettlement = false,
  inventoryItems = [],
  onRefreshInventory, // New prop
}) => {
  
  // Format values for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* First row of metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Vendas"
          value={formatCurrency(grossSales)}
          description={`${unitsSold} unidades`}
          className="bg-white"
          trend={undefined}
        />
        <MetricCard
          title="Repasses (ML)"
          value={formatCurrency(totalMLRepasses)}
          description={`${((totalMLRepasses / grossSales) * 100).toFixed(1)}% do total`}
          className="bg-white"
          trend={undefined}
          popupComponent={
            <RepassesPopup
              totalRepasses={totalMLRepasses}
              totalFees={totalMLFees}
              transactions={settlementTransactions}
              startDate={startDate}
              endDate={endDate}
            />
          }
        />
        <MetricCard
          title="Liberado"
          value={formatCurrency(totalReleased)}
          description={`${((totalReleased / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={undefined}
          popupComponent={
            <ReleasePopup
              operations={releaseOperationsWithOrder}
              totalReleased={totalReleased}
              startDate={startDate}
              endDate={endDate}
            />
          }
        />
        <MetricCard
          title="Disputas e Reembolsos"
          value={formatCurrency(totalClaims)}
          description={`${Math.abs((totalClaims / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={totalClaims < 0 ? 'negative' : undefined}
          popupComponent={
            <ClaimsPopup
              operations={releaseOtherOperations.filter(op => 
                ['reserve_for_dispute', 'refund', 'mediation', 'reserve_for_bpp_shipping_return'].includes(op.description)
              )}
              totalClaims={totalClaims}
              startDate={startDate}
              endDate={endDate}
            />
          }
        />
      </div>

      {/* Second row of metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Débitos (ML)"
          value={formatCurrency(totalDebts)}
          description={`${Math.abs((totalDebts / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={totalDebts < 0 ? 'negative' : undefined}
        />
        <MetricCard
          title="Transferências"
          value={formatCurrency(totalTransfers)}
          description={`${Math.abs((totalTransfers / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={undefined}
          popupComponent={
            <TransfersPopup
              transfers={releaseOtherOperations.filter(op => 
                ['payout', 'reserve_for_payout'].includes(op.description)
              )}
              totalTransfers={totalTransfers}
              startDate={startDate}
              endDate={endDate}
            />
          }
        />
        <MetricCard
          title="Cartão de Crédito"
          value={formatCurrency(totalCreditCard)}
          description={`${Math.abs((totalCreditCard / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={totalCreditCard < 0 ? 'negative' : undefined}
        />
        <MetricCard
          title="Envios e Cashback"
          value={formatCurrency(totalShippingCashback)}
          description={`${Math.abs((totalShippingCashback / totalMLRepasses) * 100).toFixed(1)}% dos repasses`}
          className="bg-white"
          trend={totalShippingCashback < 0 ? 'negative' : undefined}
        />
      </div>

      {/* Sales by item component */}
      <SalesBoxComponent
        settlementTransactions={settlementTransactions}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        totalMLRepasses={totalMLRepasses}
        totalMLFees={totalMLFees}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
        inventoryItems={inventoryItems}
        onRefreshInventory={onRefreshInventory} // Pass the refresh function
      />
    </div>
  );
};
