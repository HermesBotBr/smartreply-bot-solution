
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
        open={showInput}
        onOpenChange={setShowInput}
        sellerId={sellerId}
        startDate={startDate}
        endDate={endDate}
        onSave={handleSaveData}
      />

      <Tabs defaultValue="metricas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metricas">
          <FinancialMetrics 
            settlementTransactions={settlementTransactions}
            totalGrossSales={totalGrossSales}
            totalNetSales={totalNetSales}
            totalUnits={totalUnits}
            startDate={startDate}
            endDate={endDate}
            isLoading={isLoading}
            error={error}
          />
        </TabsContent>
        
        <TabsContent value="entradas">
          <SettlementTransactionsList 
            transactions={settlementTransactions} 
            isLoading={isLoading}
            error={error}
            startDate={startDate}
            endDate={endDate}
            sellerId={sellerId}
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
