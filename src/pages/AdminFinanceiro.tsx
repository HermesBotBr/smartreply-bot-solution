
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { SettlementTransactionsList } from '@/components/financeiro/SettlementTransactionsList';
import { InventoryTab } from '@/components/financeiro/InventoryTab';
import { useSettlementData } from '@/hooks/useSettlementData';
import { DataInput } from '@/components/financeiro/DataInput';

const AdminFinanceiro = () => {
  const [sellerId, setSellerId] = useState<string>("681274853");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [showInput, setShowInput] = useState<boolean>(false);
  const [settlementData, setSettlementData] = useState<string>("");
  const [releaseData, setReleaseData] = useState<string>("");

  const {
    settlementTransactions,
    totalGrossSales,
    totalNetSales,
    totalUnits,
    isLoading,
    error,
    refetch
  } = useSettlementData(sellerId, startDate, endDate);

  const handleSaveData = (seller: string, start: Date, end: Date) => {
    setSellerId(seller);
    setStartDate(start);
    setEndDate(end);
    setShowInput(false);
    setTimeout(() => {
      refetch();
    }, 300);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel Financeiro</h1>
        <Button onClick={() => setShowInput(true)}>
          Alterar Período
        </Button>
      </div>

      <DataInput
        settlementData={settlementData}
        releaseData={releaseData}
        onSettlementDataChange={setSettlementData}
        onReleaseDataChange={setReleaseData}
        startDate={startDate}
        endDate={endDate}
        settlementTransactions={settlementTransactions}
        settlementLoading={isLoading}
      />

      <Tabs defaultValue="metricas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metricas">
          <FinancialMetrics 
            grossSales={totalGrossSales}
            totalAmount={totalNetSales}
            unitsSold={totalUnits}
            totalMLRepasses={totalNetSales}
            totalMLFees={totalGrossSales - totalNetSales}
            totalReleased={0}
            totalClaims={0}
            totalDebts={0}
            totalTransfers={0}
            totalCreditCard={0}
            totalShippingCashback={0}
            settlementTransactions={settlementTransactions}
            releaseOperationsWithOrder={[]}
            releaseOtherOperations={[]}
          />
        </TabsContent>
        
        <TabsContent value="entradas">
          <SettlementTransactionsList 
            transactions={settlementTransactions}
          />
        </TabsContent>
        
        <TabsContent value="estoque">
          <InventoryTab sellerId={sellerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinanceiro;
