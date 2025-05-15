import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/dashboard/metrics/MetricCard';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RepassesPopup } from './RepassesPopup';
import { ReleasePopup } from './ReleasePopup';
import { TransfersPopup } from './TransfersPopup';
import { ClaimsPopup } from './ClaimsPopup';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { AlertCircle } from 'lucide-react';
import { SalesBoxComponent } from './SalesBoxComponent';
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
  inventoryItems?: InventoryItem[]; // New prop for inventory data
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
  inventoryItems = [], // Default to empty array
}) => {
  const [repassesPopupOpen, setRepassesPopupOpen] = useState(false);
  const [releasePopupOpen, setReleasePopupOpen] = useState(false);
  const [transfersPopupOpen, setTransfersPopupOpen] = useState(false);
  const [claimsPopupOpen, setClaimsPopupOpen] = useState(false);
  const [hasUnbalancedTransfers, setHasUnbalancedTransfers] = useState(false);
  const [filteredTotalReleased, setFilteredTotalReleased] = useState(totalReleased);
  const [filteredOperationsWithOrder, setFilteredOperationsWithOrder] = useState(releaseOperationsWithOrder);

  // Filter transfers from other operations
  const transferOperations = releaseOtherOperations.filter(op => 
    op.description?.toLowerCase().includes('payout') || 
    op.description?.toLowerCase().includes('transfer')
  );

  // Get refunded operations
  const getRefundedOperations = () => {
    if (!settlementTransactions || settlementTransactions.length === 0) {
      return [];
    }
    
    // Filtrar as transações de settlement que estão marcadas como reembolsadas
    const refundedOps = settlementTransactions
      .filter(transaction => transaction.isRefunded)
      .map(transaction => ({
        orderId: transaction.orderId,
        itemId: transaction.itemId || '',
        title: transaction.title || '',
        amount: transaction.netValue || 0, // Usar netValue (valor do repasse)
        description: 'Venda reembolsada'
      }));
    
    return refundedOps;
  };

  // Get claim operations
  const getClaimOperations = () => {
    return releaseOtherOperations.filter(op => {
      const desc = op.description?.toLowerCase() || '';
      return desc.includes('dispute') || 
             desc.includes('refund') || 
             desc.includes('mediation') || 
             desc.includes('shipping_return');
    });
  };

  // Calculate total refunded amount
  const refundedOperations = getRefundedOperations();
  const refundedAmount = refundedOperations.reduce((sum, op) => sum + op.amount, 0);

  // Calculate total claims including refunds
  const totalClaimsWithRefunds = Math.abs(totalClaims) + Math.abs(refundedAmount);

  // Check if transfers are balanced when the component mounts or when transferOperations changes
  useEffect(() => {
    const checkTransferBalance = async () => {
      if (transferOperations.length === 0) {
        setHasUnbalancedTransfers(false);
        return;
      }

      try {
        // Get the seller_id from the mlToken hook
        const mlToken = JSON.parse(localStorage.getItem('ml_token') || '{}');
        const sellerId = mlToken.seller_id || '681274853';

        // Fetch descriptions from API
        const response = await fetch(`https://projetohermes-dda7e0c8d836.herokuapp.com/trans_desc?seller_id=${sellerId}`);
        const apiDescriptions = await response.json();

        // Calculate if transfers are balanced
        let totalTransfersValue = 0;
        let totalDeclaredValue = 0;

        transferOperations.forEach(transfer => {
          totalTransfersValue += transfer.amount;
          
          // Find descriptions for this transfer
          const transferDescriptions = apiDescriptions.filter(
            (desc: any) => desc.source_id === transfer.sourceId
          );
          
          // Sum up declared values
          const declaredSum = transferDescriptions.reduce(
            (sum: number, desc: any) => sum + parseFloat(desc.valor), 0
          );
          
          totalDeclaredValue += declaredSum;
        });

        // Check if balanced (allow for small floating point errors)
        const difference = totalTransfersValue + totalDeclaredValue;
        setHasUnbalancedTransfers(Math.abs(difference) > 0.01);
      } catch (error) {
        console.error('Error checking transfer balance:', error);
      }
    };

    checkTransferBalance();
  }, [transferOperations]);

  // Effect for filtering operations and recalculating totals based on the toggle
  useEffect(() => {
    if (filterBySettlement && settlementTransactions.length > 0) {
      // Create a set of order IDs from settlement transactions for quick lookup
      const settlementOrderIds = new Set(
        settlementTransactions.map(transaction => transaction.orderId)
      );

      // Filter release operations by checking if their orderId exists in settlement
      const filtered = releaseOperationsWithOrder.filter(operation => 
        operation.orderId && settlementOrderIds.has(operation.orderId)
      );

      // Calculate the filtered total released amount
      const filteredTotal = filtered.reduce((sum, op) => sum + op.amount, 0);
      
      // Update state with filtered values
      setFilteredTotalReleased(filteredTotal);
      setFilteredOperationsWithOrder(filtered);
    } else {
      // Reset to original values when filter is off
      setFilteredTotalReleased(totalReleased);
      setFilteredOperationsWithOrder(releaseOperationsWithOrder);
    }
  }, [filterBySettlement, settlementTransactions, releaseOperationsWithOrder, totalReleased]);

  // Display value to show in the "Liberado" card
  const displayTotalReleased = filterBySettlement ? filteredTotalReleased : totalReleased;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Bruto (ML)"
          value={`R$ ${grossSales.toFixed(2)}`}
          description={`Unidades vendidas: ${unitsSold}`}
          className="bg-gray-50 hover:bg-gray-100 transition-colors"
          textColor="text-gray-800"
        />
        <MetricCard
          title="Repasse Total (ML)"
          value={`R$ ${totalMLRepasses.toFixed(2)}`}
          description={`Clique para detalhar`}
          className="bg-blue-50 hover:bg-blue-100 transition-colors"
          textColor="text-blue-800"
          onClick={() => setRepassesPopupOpen(true)}
        />
        <MetricCard
          title="Taxas (ML)"
          value={`R$ ${totalMLFees.toFixed(2)}`}
          description={`${((totalMLFees / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
          className="bg-red-50 hover:bg-red-100 transition-colors"
          textColor="text-red-800"
        />
        <MetricCard
          title="Liberado"
          value={`R$ ${displayTotalReleased.toFixed(2)}`}
          description={`Clique para detalhar${filterBySettlement ? ' (filtrado)' : ''}`}
          className="bg-green-50 hover:bg-green-100 transition-colors"
          textColor="text-green-800"
          onClick={() => setReleasePopupOpen(true)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-full md:col-span-2">
          <Tabs defaultValue="maior-detalhe">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="maior-detalhe">Maior Detalhe</TabsTrigger>
              <TabsTrigger value="resumido">Resumido</TabsTrigger>
            </TabsList>
            
            <TabsContent value="maior-detalhe" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Contestações"
                  value={`R$ ${totalClaimsWithRefunds.toFixed(2)}`}
                  description={`${((totalClaimsWithRefunds / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-amber-50 hover:bg-amber-100 transition-colors"
                  textColor="text-amber-800"
                  onClick={() => setClaimsPopupOpen(true)}
                />
                
                <MetricCard
                  title="Dívidas"
                  value={`R$ ${Math.abs(totalDebts).toFixed(2)}`}
                  description={`${((Math.abs(totalDebts) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-purple-50 hover:bg-purple-100 transition-colors"
                  textColor="text-purple-800"
                />
                
                <MetricCard
                  title="Transferências"
                  value={`R$ ${Math.abs(totalTransfers).toFixed(2)}`}
                  description={`${((Math.abs(totalTransfers) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  textColor="text-indigo-800"
                  onClick={() => setTransfersPopupOpen(true)}
                  alertStatus={hasUnbalancedTransfers}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="resumido" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                  title="Cartão de Crédito"
                  value={`R$ ${Math.abs(totalCreditCard).toFixed(2)}`}
                  description={`${((Math.abs(totalCreditCard) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-lime-50 hover:bg-lime-100 transition-colors"
                  textColor="text-lime-800"
                />
                
                <MetricCard
                  title="Frete e Cashback"
                  value={`R$ ${Math.abs(totalShippingCashback).toFixed(2)}`}
                  description={`${((Math.abs(totalShippingCashback) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-sky-50 hover:bg-sky-100 transition-colors"
                  textColor="text-sky-800"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Sales Box Component - Now passing inventory data */}
      <SalesBoxComponent 
        settlementTransactions={settlementTransactions}
        releaseOperationsWithOrder={releaseOperationsWithOrder}
        totalMLRepasses={totalMLRepasses}
        totalMLFees={totalMLFees}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
        inventoryItems={inventoryItems}
      />
      
      <RepassesPopup 
        transactions={settlementTransactions}
        open={repassesPopupOpen}
        onClose={() => setRepassesPopupOpen(false)}
        startDate={startDate}
        endDate={endDate}
      />
      
      <ReleasePopup
        operationsWithOrder={filteredOperationsWithOrder}
        otherOperations={releaseOtherOperations}
        settlementTransactions={settlementTransactions}
        open={releasePopupOpen}
        onClose={() => setReleasePopupOpen(false)}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
      />
      
      <TransfersPopup
        transfers={transferOperations}
        open={transfersPopupOpen}
        onClose={() => setTransfersPopupOpen(false)}
        startDate={startDate}
        endDate={endDate}
      />
      
      <ClaimsPopup
        refundedOperations={refundedOperations}
        claimOperations={getClaimOperations()}
        open={claimsPopupOpen}
        onClose={() => setClaimsPopupOpen(false)}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};
