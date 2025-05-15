
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SalesBoxComponent } from './SalesBoxComponent';
import { MetricDisplay } from './MetricDisplay';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { RepassesPopup } from './RepassesPopup';
import { TransfersPopup } from './TransfersPopup';
import { ClaimsPopup } from './ClaimsPopup';
import { ReleasePopup } from './ReleasePopup';
import { InventoryItem } from '@/types/inventory';
import { PublicidadePopup } from './PublicidadePopup';
import { AdvertisingItem } from '@/hooks/usePublicidadeData';

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
  advertisingItems?: AdvertisingItem[];
  totalAdvertisingCost: number;
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
  filterBySettlement,
  inventoryItems,
  advertisingItems = [],
  totalAdvertisingCost = 0
}) => {
  const [repassesPopupOpen, setRepassesPopupOpen] = useState(false);
  const [releasesPopupOpen, setReleasesPopupOpen] = useState(false);
  const [claimsPopupOpen, setClaimsPopupOpen] = useState(false);
  const [transfersPopupOpen, setTransfersPopupOpen] = useState(false);
  const [publicidadePopupOpen, setPublicidadePopupOpen] = useState(false);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricDisplay
          title="Gross Sales"
          value={grossSales}
          description={`${unitsSold} unidades vendidas`}
          onClick={() => setRepassesPopupOpen(true)}
        />
        <MetricDisplay
          title="Liberações"
          value={totalReleased}
          description="Valores já liberados"
          onClick={() => setReleasesPopupOpen(true)}
        />
        <MetricDisplay
          title="Contestações"
          value={totalClaims}
          description="Valores em análise"
          onClick={() => setClaimsPopupOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricDisplay 
          title="Repasses"
          value={totalMLRepasses}
          description="Total repassado pelo ML"
        />
        <MetricDisplay 
          title="Taxas"
          value={totalMLFees}
          description="Total de taxas do ML"
        />
        <MetricDisplay 
          title="Transfers"
          value={totalTransfers}
          description="Transferências bancárias"
          onClick={() => setTransfersPopupOpen(true)}
        />
        <MetricDisplay 
          title="Publicidade"
          value={totalAdvertisingCost}
          description="Gastos com anúncios"
          onClick={() => setPublicidadePopupOpen(true)}
        />
      </div>

      <SalesBoxComponent
        settlementTransactions={settlementTransactions}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        totalMLRepasses={totalMLRepasses}
        totalMLFees={totalMLFees}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
        inventoryItems={inventoryItems}
        advertisingItems={advertisingItems}
      />

      {/* Popups */}
      <RepassesPopup
        open={repassesPopupOpen}
        onClose={() => setRepassesPopupOpen(false)}
        transactions={settlementTransactions}
        startDate={startDate}
        endDate={endDate}
      />
      
      <ReleasePopup
        open={releasesPopupOpen}
        onClose={() => setReleasesPopupOpen(false)}
        operationsWithOrder={releaseOperationsWithOrder}
        otherOperations={releaseOtherOperations}
        settlementTransactions={settlementTransactions}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
      />
      
      <ClaimsPopup
        open={claimsPopupOpen}
        onClose={() => setClaimsPopupOpen(false)}
        refundedOperations={releaseOtherOperations.filter(op => 
          op.description?.includes('refund') || false
        )}
        claimOperations={releaseOtherOperations.filter(op => 
          (op.description?.includes('reserve_for_dispute') || 
          op.description?.includes('mediation') ||
          op.description?.includes('reserve_for_bpp_shipping_return')) || false
        )}
        startDate={startDate}
        endDate={endDate}
      />
      
      <TransfersPopup
        open={transfersPopupOpen}
        onClose={() => setTransfersPopupOpen(false)}
        transfers={releaseOtherOperations.filter(op => 
          (op.description?.includes('payout') || 
          op.description?.includes('reserve_for_payout')) || false
        )}
      />

      <PublicidadePopup
        open={publicidadePopupOpen}
        onClose={() => setPublicidadePopupOpen(false)}
        advertisingItems={advertisingItems}
        startDate={startDate}
        endDate={endDate}
        totalCost={totalAdvertisingCost}
      />
    </div>
  );
};
