import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesBoxComponent } from "./SalesBoxComponent";
import { ReleaseOperation } from "@/types/ReleaseOperation";
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { RepassesPopup } from './RepassesPopup';
import { ReleasePopup } from './ReleasePopup';
import { ClaimsPopup } from './ClaimsPopup';
import { ProductListingPopup } from './ProductListingPopup';
import { TransfersPopup } from './TransfersPopup';
import { InventoryItem } from '@/types/inventory';
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
  totalAdvertisingCost?: number;
  onRefreshAdvertisingData?: () => void; // Add the new refresh callback prop
}

export const FinancialMetrics = ({
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
  advertisingItems,
  totalAdvertisingCost,
  onRefreshAdvertisingData, // Add the new prop for refreshing advertising data
}: FinancialMetricsProps) => {
  const [showRepassesPopup, setShowRepassesPopup] = useState(false);
  const [showReleasePopup, setShowReleasePopup] = useState(false);
  const [showClaimsPopup, setShowClaimsPopup] = useState(false);
  const [showProductListingPopup, setShowProductListingPopup] = useState(false);
  const [showTransfersPopup, setShowTransfersPopup] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Visão geral das suas métricas financeiras.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vendas Brutas</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossSales)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Valor Total</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Unidades Vendidas</div>
            <div className="text-2xl font-bold">{unitsSold}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Taxas (ML)</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMLFees)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes de Repasses</CardTitle>
          <CardDescription>Informações detalhadas sobre os repasses.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 md:grid-cols-5 gap-4">
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={() => setShowReleasePopup(true)}>
            <div className="text-sm font-medium text-muted-foreground">Total Liberado</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReleased)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={() => setShowClaimsPopup(true)}>
            <div className="text-sm font-medium text-muted-foreground">Total Reclamações</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalClaims)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md">
            <div className="text-sm font-medium text-muted-foreground">Total Dívidas</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebts)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={() => setShowTransfersPopup(true)}>
            <div className="text-sm font-medium text-muted-foreground">Total Transferências</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTransfers)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md">
            <div className="text-sm font-medium text-muted-foreground">Total Cartão de Crédito</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCreditCard)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md">
            <div className="text-sm font-medium text-muted-foreground">Total Frete (Cashback)</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalShippingCashback)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md" onClick={() => setShowRepassesPopup(true)}>
            <div className="text-sm font-medium text-muted-foreground">Total Repasses (ML)</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMLRepasses)}
            </div>
          </div>
          <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md">
            <div className="text-sm font-medium text-muted-foreground">Custo total publicidade</div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAdvertisingCost || 0)}
            </div>
          </div>
        </CardContent>
      </Card>
      
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
        onRefreshData={onRefreshAdvertisingData} // Pass the refresh callback
      />

      <RepassesPopup
        isOpen={showRepassesPopup}
        onClose={() => setShowRepassesPopup(false)}
        totalMLRepasses={totalMLRepasses}
        settlementTransactions={settlementTransactions}
        startDate={startDate}
        endDate={endDate}
      />

      <ReleasePopup
        isOpen={showReleasePopup}
        onClose={() => setShowReleasePopup(false)}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        releaseOtherOperations={releaseOtherOperations}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
      />

      <ClaimsPopup
        isOpen={showClaimsPopup}
        onClose={() => setShowClaimsPopup(false)}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        releaseOtherOperations={releaseOtherOperations}
        startDate={startDate}
        endDate={endDate}
      />

      <TransfersPopup
        isOpen={showTransfersPopup}
        onClose={() => setShowTransfersPopup(false)}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        releaseOtherOperations={releaseOtherOperations}
        startDate={startDate}
        endDate={endDate}
      />

      <ProductListingPopup
        isOpen={showProductListingPopup}
        onClose={() => setShowProductListingPopup(false)}
        settlementTransactions={settlementTransactions}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};
