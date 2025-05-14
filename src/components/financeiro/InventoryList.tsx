
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { InventoryItemCard } from './InventoryItemCard';
import { InventoryItem } from '@/types/inventory';
import { Package } from 'lucide-react';
import { useSalesForInventory } from '@/hooks/useSalesForInventory';

interface InventoryListProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  sellerId: string | null;
}

export function InventoryList({ inventoryItems, isLoading, sellerId }: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { salesByItemId, isLoading: salesLoading } = useSalesForInventory(sellerId, inventoryItems);

  // Filter items based on search query
  const filteredItems = inventoryItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.itemId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Input
          type="text"
          placeholder="Buscar por título ou ID do produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <InventoryItemCard 
            key={item.itemId} 
            item={item} 
            salesCount={salesByItemId[item.itemId] || 0}
            salesLoading={salesLoading}
          />
        ))}
      </div>
    </div>
  );
}
