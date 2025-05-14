
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryList } from '@/components/financeiro/InventoryList';
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { TransactionsList } from '@/components/financeiro/TransactionsList';
import { SettlementTransactionsList } from '@/components/financeiro/SettlementTransactionsList';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/dashboard/metrics/DateRangePicker';
import { format } from 'date-fns';
import { DataInput } from '@/components/financeiro/DataInput';
import { ShieldCheck, FileText, Store, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReleasePopup } from '@/components/financeiro/ReleasePopup';
import { RepassesPopup } from '@/components/financeiro/RepassesPopup';
import { TransfersPopup } from '@/components/financeiro/TransfersPopup';
import { ProductListingPopup } from '@/components/financeiro/ProductListingPopup';
import { useSettlementData } from '@/hooks/useSettlementData';
import { useNavigate } from 'react-router-dom';
import { useMlToken } from '@/hooks/useMlToken';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSalesForInventory } from '@/hooks/useSalesForInventory';

// Define the proper date range interface
interface DateRange {
  from?: Date;
  to?: Date;
}

const AdminFinanceiro = () => {
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [isRepassesOpen, setIsRepassesOpen] = useState(false);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);
  const [isProductListingOpen, setIsProductListingOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [settlementDateRange, setSettlementDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [releaseData, setReleaseData] = useState('');
  const [repassesData, setRepassesData] = useState('');
  const [transfersData, setTransfersData] = useState('');
  const [productListingData, setProductListingData] = useState('');
  const [transactionsData, setTransactionsData] = useState('');
  const [settlementTransactionsData, setSettlementTransactionsData] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const mlToken = useMlToken();
  const navigate = useNavigate();

  const { settlementTransactions, isLoading: settlementLoading, error: settlementError, refetch: settlementRefetch } = useSettlementData(
    '681274853',
    settlementDateRange.from,
    settlementDateRange.to,
  );

  useEffect(() => {
    if (!mlToken) {
      navigate('/');
    }
  }, [mlToken, navigate]);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handleSettlementDateRangeChange = (newDateRange: DateRange) => {
    setSettlementDateRange(newDateRange);
  };

  const handleReleaseDataChange = (data: string) => {
    setReleaseData(data);
  };

  const handleRepassesDataChange = (data: string) => {
    setRepassesData(data);
  };

  const handleTransfersDataChange = (data: string) => {
    setTransfersData(data);
  };

  const handleProductListingDataChange = (data: string) => {
    setProductListingData(data);
  };

  const handleTransactionsDataChange = (data: string) => {
    setTransactionsData(data);
  };

  const handleSettlementTransactionsDataChange = (data: string) => {
    setSettlementTransactionsData(data);
  };

  const handleSaveRelease = () => {
    localStorage.setItem('releaseData', releaseData);
    toast({
      title: "Dados de lançamentos salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
    setIsReleaseOpen(false);
  };

  const handleSaveRepasses = () => {
    localStorage.setItem('repassesData', repassesData);
    toast({
      title: "Dados de repasses salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
    setIsRepassesOpen(false);
  };

  const handleSaveTransfers = () => {
    localStorage.setItem('transfersData', transfersData);
    toast({
      title: "Dados de transferências salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
    setIsTransfersOpen(false);
  };

  const handleSaveProductListing = () => {
    localStorage.setItem('productListingData', productListingData);
    toast({
      title: "Dados de listagem de produtos salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
    setIsProductListingOpen(false);
  };

  const handleSaveTransactions = () => {
    localStorage.setItem('transactionsData', transactionsData);
    toast({
      title: "Dados de transações salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
  };

  const handleSaveSettlementTransactions = () => {
    localStorage.setItem('settlementTransactionsData', settlementTransactionsData);
    toast({
      title: "Dados de transações de liquidação salvos",
      description: "Os dados foram armazenados com sucesso.",
    });
  };

  // Fixed sellerId for testing - in production this would come from authentication
  const sellerId = '681274853';
  
  const { items: inventoryItems, isLoading: inventoryLoading } = useInventoryData(sellerId);
  
  // Use the hook to get sales data for inventory
  const { salesByItemId, isLoading: salesLoading } = useSalesForInventory(sellerId, inventoryItems || []);
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const savedReleaseData = localStorage.getItem('releaseData');
    if (savedReleaseData) {
      setReleaseData(savedReleaseData);
    }

    const savedRepassesData = localStorage.getItem('repassesData');
    if (savedRepassesData) {
      setRepassesData(savedRepassesData);
    }

    const savedTransfersData = localStorage.getItem('transfersData');
    if (savedTransfersData) {
      setTransfersData(savedTransfersData);
    }

    const savedProductListingData = localStorage.getItem('productListingData');
    if (savedProductListingData) {
      setProductListingData(savedProductListingData);
    }

    const savedTransactionsData = localStorage.getItem('transactionsData');
    if (savedTransactionsData) {
      setTransactionsData(savedTransactionsData);
    }

    const savedSettlementTransactionsData = localStorage.getItem('settlementTransactionsData');
    if (savedSettlementTransactionsData) {
      setSettlementTransactionsData(savedSettlementTransactionsData);
    }
  }, []);
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Painel Financeiro Administrativo</h1>
      
      <Tabs defaultValue="estoque" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="estoque" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="transacoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger value="cadastro" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Cadastro</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Estoque</CardTitle>
              <CardDescription>
                Acompanhe seu inventário, custos médios e valor total de estoque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList 
                inventoryItems={inventoryItems} 
                isLoading={inventoryLoading} 
                sellerId={sellerId}
                salesByItemId={salesByItemId}
                salesLoading={salesLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metricas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Financeiras</CardTitle>
              <CardDescription>
                Analise o desempenho financeiro do seu negócio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialMetrics 
                grossSales={0}
                totalAmount={0}
                unitsSold={0}
                totalMLRepasses={0}
                totalMLFees={0}
                totalReleased={0}
                totalClaims={0}
                totalDebts={0}
                totalTransfers={0}
                totalCreditCard={0}
                totalShippingCashback={0}
                settlementTransactions={settlementTransactions || []}
                releaseOperationsWithOrder={[]}
                releaseOtherOperations={[]}
                startDate={settlementDateRange.from}
                endDate={settlementDateRange.to}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                Visualize e gerencie suas transações financeiras.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DateRangePicker 
                date={settlementDateRange}
                onSelect={handleSettlementDateRangeChange}
              />
              <SettlementTransactionsList 
                transactions={settlementTransactions || []}
              />
              <DataInput
                label="Transações de Liquidação"
                value={settlementTransactionsData}
                onChange={handleSettlementTransactionsDataChange}
                onSave={handleSaveSettlementTransactions}
              />
              <TransactionsList 
                transactions={JSON.parse(transactionsData || '[]')} 
              />
              <DataInput
                label="Transações"
                value={transactionsData}
                onChange={handleTransactionsDataChange}
                onSave={handleSaveTransactions}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cadastro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Dados</CardTitle>
              <CardDescription>
                Insira e gerencie dados financeiros importantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button onClick={() => setIsReleaseOpen(true)}>
                Inserir Dados de Lançamento
              </Button>
              <Button onClick={() => setIsRepassesOpen(true)}>
                Inserir Dados de Repasses
              </Button>
              <Button onClick={() => setIsTransfersOpen(true)}>
                Inserir Dados de Transferências
              </Button>
              <Button onClick={() => setIsProductListingOpen(true)}>
                Inserir Dados de Listagem de Produtos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ReleasePopup
        open={isReleaseOpen}
        onClose={() => setIsReleaseOpen(false)}
        releaseData={releaseData}
        onDataChange={handleReleaseDataChange}
        onSave={handleSaveRelease}
      />
      
      <RepassesPopup
        open={isRepassesOpen}
        onClose={() => setIsRepassesOpen(false)}
        repassesData={repassesData}
        onDataChange={handleRepassesDataChange}
        onSave={handleSaveRepasses}
      />
      
      <TransfersPopup
        open={isTransfersOpen}
        onClose={() => setIsTransfersOpen(false)}
        transfersData={transfersData}
        onDataChange={handleTransfersDataChange}
        onSave={handleSaveTransfers}
      />
      
      <ProductListingPopup
        open={isProductListingOpen}
        onClose={() => setIsProductListingOpen(false)}
        productListingData={productListingData}
        onDataChange={handleProductListingDataChange}
        onSave={handleSaveProductListing}
      />
    </div>
  );
};

export default AdminFinanceiro;
