
import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/dashboard/metrics/MetricCard';
import { SettlementTransaction } from '@/hooks/useSettlementData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RepassesPopup } from './RepassesPopup';
import { ReleasePopup } from './ReleasePopup';
import { TransfersPopup } from './TransfersPopup';
import { ReleaseOperation } from '@/types/ReleaseOperation';

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
}) => {
  const [repassesPopupOpen, setRepassesPopupOpen] = useState(false);
  const [releasePopupOpen, setReleasePopupOpen] = useState(false);
  const [transfersPopupOpen, setTransfersPopupOpen] = useState(false);
  const [transferOperations, setTransferOperations] = useState<ReleaseOperation[]>([]);
  const [hasUndescribedTransfers, setHasUndescribedTransfers] = useState(false);

  // Filter transfers from other operations
  useEffect(() => {
    const operations = releaseOtherOperations.filter(op => 
      op.description?.toLowerCase().includes('payout') || 
      op.description?.toLowerCase().includes('transfer')
    );

    setTransferOperations(operations);

    // Check if any transfers lack proper descriptions
    const transfersBySourceId = operations.reduce((acc: Record<string, {total: number, described: number}>, transfer) => {
      const sourceId = transfer.sourceId || '';
      if (!acc[sourceId]) {
        acc[sourceId] = { total: 0, described: 0 };
      }
      acc[sourceId].total += transfer.amount;
      
      // If it has a description that is not the default, it's been described
      if (transfer.description && transfer.description !== 'Transferência') {
        acc[sourceId].described += transfer.amount;
      }
      
      return acc;
    }, {});

    // Check if there are any undescribed transfers
    const hasUndescribed = Object.values(transfersBySourceId).some(
      transfer => transfer.described < transfer.total
    );
    
    setHasUndescribedTransfers(hasUndescribed);
  }, [releaseOtherOperations]);

  // Handle updating transfer descriptions
  const handleUpdateTransferDescription = (sourceId: string, description: string, value: number) => {
    // Create a new transfer operation with the provided description
    const newTransferOperation: ReleaseOperation = {
      sourceId,
      description,
      amount: value
    };

    // Find the matching transfer to adjust its amount
    const updatedOperations = transferOperations.map(op => {
      if (op.sourceId === sourceId && (!op.description || op.description === 'Transferência')) {
        // Reduce the amount of the original operation
        return {
          ...op,
          amount: op.amount - value
        };
      }
      return op;
    });

    // Add the new operation with description
    const finalOperations = [...updatedOperations, newTransferOperation];
    
    // Filter out any operations with zero amount
    const filteredOperations = finalOperations.filter(op => op.amount !== 0);
    
    setTransferOperations(filteredOperations);
    
    // Re-check if there are still undescribed transfers
    const transfersBySourceId = filteredOperations.reduce((acc: Record<string, {total: number, described: number}>, transfer) => {
      const sourceId = transfer.sourceId || '';
      if (!acc[sourceId]) {
        acc[sourceId] = { total: 0, described: 0 };
      }
      acc[sourceId].total += transfer.amount;
      
      if (transfer.description && transfer.description !== 'Transferência') {
        acc[sourceId].described += transfer.amount;
      }
      
      return acc;
    }, {});

    const stillHasUndescribed = Object.values(transfersBySourceId).some(
      transfer => transfer.described < transfer.total
    );
    
    setHasUndescribedTransfers(stillHasUndescribed);
  };

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
          value={`R$ ${totalReleased.toFixed(2)}`}
          description={`Clique para detalhar`}
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
                  value={`R$ ${Math.abs(totalClaims).toFixed(2)}`}
                  description={`${((Math.abs(totalClaims) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-amber-50 hover:bg-amber-100 transition-colors"
                  textColor="text-amber-800"
                />
                
                <MetricCard
                  title="Dívidas"
                  value={`R$ ${Math.abs(totalDebts).toFixed(2)}`}
                  description={`${((Math.abs(totalDebts) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className="bg-purple-50 hover:bg-purple-100 transition-colors"
                  textColor="text-purple-800"
                />
                
                <MetricCard
                  title={hasUndescribedTransfers ? "Transferências ●" : "Transferências"}
                  value={`R$ ${Math.abs(totalTransfers).toFixed(2)}`}
                  description={`${((Math.abs(totalTransfers) / (grossSales || 1)) * 100).toFixed(1)}% do valor bruto`}
                  className={`${hasUndescribedTransfers ? "border-2 border-indigo-300" : ""} bg-indigo-50 hover:bg-indigo-100 transition-colors`}
                  textColor="text-indigo-800"
                  onClick={() => setTransfersPopupOpen(true)}
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
      
      <RepassesPopup 
        transactions={settlementTransactions}
        open={repassesPopupOpen}
        onClose={() => setRepassesPopupOpen(false)}
      />
      
      <ReleasePopup
        operationsWithOrder={releaseOperationsWithOrder}
        otherOperations={releaseOtherOperations}
        settlementTransactions={settlementTransactions}
        open={releasePopupOpen}
        onClose={() => setReleasePopupOpen(false)}
      />
      
      <TransfersPopup
        transfers={transferOperations}
        open={transfersPopupOpen}
        onClose={() => setTransfersPopupOpen(false)}
        onUpdateTransferDescription={handleUpdateTransferDescription}
      />
    </div>
  );
};
