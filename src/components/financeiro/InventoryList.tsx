
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InventoryItemCard } from './InventoryItemCard';
import { InventoryItem } from '@/types/inventory';
import { Package, CalendarDays, RefreshCw, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminSalesData } from '@/hooks/useAdminSalesData';
import { useMlToken } from '@/hooks/useMlToken';
import { SalesDetailPopup } from './SalesDetailPopup';
import { parseBrazilianDate } from '@/lib/utils';

interface InventoryListProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  onRefreshDates?: () => void;
  firstPurchaseDate?: string | null;
  totalUnitsSold?: number;
  salesByItemId?: Record<string, number>;
  detailedSales?: any[];
}


export function InventoryList({ 
  inventoryItems, 
  isLoading, 
  onRefreshDates, 
  firstPurchaseDate, 
  totalUnitsSold, 
  salesByItemId = {}, 
  detailedSales = [] 
}: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [salesPopupOpen, setSalesPopupOpen] = useState<boolean>(false);
  const [fetchingSales, setFetchingSales] = useState<boolean>(false);
  const [totalUnitsSoldSinceFirstPurchase, setTotalUnitsSoldSinceFirstPurchase] = useState<number>(0);
  
  // Get the fetchSalesData function from the useAdminSalesData hook
  const { fetchSalesData } = useAdminSalesData();

  // Get seller ID from ML token
  const mlToken = useMlToken();
  const sellerId = typeof mlToken === 'object' && mlToken !== null && 'seller_id' in mlToken 
    ? mlToken.seller_id 
    : '681274853'; // Default seller ID
  
  // Filter items based on search query
  const filteredItems = inventoryItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.itemId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Function to format date from DD/MM/YYYY to MM/DD/YYYY for the API call
  const formatDateForApi = (dateStr: string): string => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${day}/${month}/${year}`; // Keep the slash format
  };
  
  // Function to get today's date in DD/MM/YYYY format
  const getTodayFormatted = (): string => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  };
  
  // Function to fetch sales data since first purchase
  const fetchSalesSinceFirstPurchase = async () => {
    if (!firstPurchaseDate) return;
    
    setFetchingSales(true);
    toast({
      title: "Buscando vendas",
      description: "Calculando vendas desde a primeira reposição..."
    });
    
    try {
      const today = getTodayFormatted();
      const formattedFirstPurchaseDate = formatDateForApi(firstPurchaseDate);
      
      const totalUnits = await fetchSalesData(sellerId, formattedFirstPurchaseDate, formatDateForApi(today));
      setTotalUnitsSoldSinceFirstPurchase(totalUnits);
      
      // Logar detalhes das vendas no console
      console.log('Detalhes das vendas desde a primeira reposição:');
      console.table(detailedSales.map(sale => ({
        'Order ID': sale.orderId,
        'Item ID': sale.itemId,
        'Título': sale.title || 'N/A',
        'Quantidade': sale.quantity,
        'Data e Hora': new Date(sale.dateCreated).toLocaleString('pt-BR')
      })));
      
      toast({
        title: "Vendas calculadas",
        description: "Dados de vendas atualizados com sucesso."
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os dados de vendas.",
        variant: "destructive"
      });
    } finally {
      setFetchingSales(false);
    }
  };

  const handleRefresh = () => {
    if (onRefreshDates) {
      setRefreshing(true);
      toast({
        title: "Atualizando datas",
        description: "Buscando datas de compra do relatório Release..."
      });
      
      // Call the refresh function
      onRefreshDates();
      
      // Reset refreshing state after a short delay to show animation
      setTimeout(() => {
        setRefreshing(false);
        toast({
          title: "Datas atualizadas",
          description: "As datas de compra foram atualizadas com sucesso."
        });
      }, 1000);
    }
  };

  const handleSalesCardClick = () => {
    setSalesPopupOpen(true);
  };

  // Handler for inventory updates
  const handleInventoryUpdated = () => {
    if (onRefreshDates) {
      onRefreshDates();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de estoque...</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum item de estoque encontrado</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Não foram encontradas compras de mercadoria nas transações.
        </p>
      </div>
    );
  }

  const totalItems = filteredItems.length;
  const totalUnits = filteredItems.reduce((acc, item) => acc + item.totalQuantity, 0);
  const totalValue = filteredItems.reduce((acc, item) => {
    const weightedAverageCost = item.purchases.reduce((total, purchase) => 
      total + (purchase.unitCost * purchase.quantity), 0) / item.totalQuantity;
    return acc + (item.totalQuantity * weightedAverageCost);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Input
            type="text"
            placeholder="Buscar por título ou ID do produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || !onRefreshDates}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Atualizar datas</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total de Produtos</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total de Unidades</p>
            <p className="text-2xl font-bold">{totalUnits}</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
            <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg flex flex-col">
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Primeira Reposição</p>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {firstPurchaseDate ? firstPurchaseDate : 'N/A'}
            </p>
          </div>
          <div 
            className="bg-primary/10 p-4 rounded-lg flex flex-col cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={handleSalesCardClick}
          >
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Vendas dês da primeira reposição</p>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {totalUnitsSold !== undefined ? `${totalUnitsSold} unidades` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <InventoryItemCard 
            key={item.itemId} 
            item={item} 
            salesCount={salesByItemId[item.itemId] || 0}
            onInventoryUpdated={handleInventoryUpdated}
          />
        ))}
      </div>

      <SalesDetailPopup
        open={salesPopupOpen}
        onClose={() => setSalesPopupOpen(false)}
        salesByItemId={salesByItemId || {}}
        detailedSales={detailedSales || []}
        totalUnitsSold={totalUnitsSold || 0}
      />
    </div>
  );
}
