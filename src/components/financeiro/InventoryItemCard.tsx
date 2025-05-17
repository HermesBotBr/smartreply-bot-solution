
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, ShoppingBag, Plus } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProductListingPopup } from './ProductListingPopup';
import { useMlToken } from '@/hooks/useMlToken';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';

interface InventoryItemCardProps {
  item: InventoryItem;
  salesCount?: number;
  onInventoryUpdated?: () => void;
}

export function InventoryItemCard({ item, salesCount = 0, onInventoryUpdated }: InventoryItemCardProps) {
  const [productListingOpen, setProductListingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get seller_id from user token
  const mlToken = useMlToken();
  const sellerId = mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken
    ? (mlToken as { seller_id: string }).seller_id
    : '681274853'; // Default ID if not found

  // Calculate weighted average cost
  const weightedAverageCost = item.purchases.reduce((total, purchase) => 
    total + (purchase.unitCost * purchase.quantity), 0) / item.totalQuantity;
  
  // Calculate actual inventory after sales
  const actualInventory = Math.max(0, item.totalQuantity - salesCount);
  
  // Calculate total inventory value based on actual inventory
  const totalInventoryValue = actualInventory * weightedAverageCost;

  // Calculate sales distribution for each purchase in chronological order
  const purchasesWithSales = [...item.purchases]
    // Sort purchases by date (oldest first) to distribute sales chronologically
    // Using our new compareBrazilianDates function for proper date sorting
    .sort((a, b) => compareBrazilianDates(a.date, b.date))
    // Add the sales distribution to each purchase
    .reduce((acc, purchase) => {
      const previousSalesAssigned = acc.reduce((total, p) => total + (p.salesAssigned || 0), 0);
      const remainingSales = Math.max(0, salesCount - previousSalesAssigned);
      
      // Assign sales to this purchase (cannot exceed purchase quantity)
      const salesAssigned = Math.min(purchase.quantity, remainingSales);
      
      // Add the purchase with the calculated sales
      acc.push({
        ...purchase,
        salesAssigned
      });
      
      return acc;
    }, [] as Array<typeof item.purchases[0] & { salesAssigned?: number }>);

  // Create the product object in the required format for the ProductListingPopup
  const productForListing = {
    mlb: item.itemId,
    title: item.title,
    image: '', // We don't have an image in our inventory data
    active: true
  };

  // Handle adding a new purchase for this product
  const handleAddPurchase = async (product: any, quantity: number, value: number) => {
    if (!value || value <= 0) {
      toast({
        title: "Erro",
        description: "O valor da compra deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Format description for the transaction
      const description = `Compra de mercadoria: ${quantity}x ${product.title} (${product.mlb})`;
      
      // Generate a unique source_id for this transaction
      const sourceId = `manual_purchase_${Date.now()}`;
      
      // Save the transaction description to the API
      await axios.post(getNgrokUrl('/trans_desc'), {
        seller_id: sellerId,
        source_id: sourceId,
        descricao: description,
        valor: value.toString()
      });
      
      toast({
        title: "Sucesso",
        description: "Compra adicionada com sucesso!",
      });
      
      // Notify parent component to refresh inventory data
      if (onInventoryUpdated) {
        onInventoryUpdated();
      }
      
      setIsLoading(false);
      setProductListingOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a compra",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Handle the product selection from the popup
  const handleProductSelect = (product: any, quantity: number) => {
    // ProductListingPopup will be closed automatically when a product is selected
    // We don't need to do anything else here as the popup will handle showing the value input
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
            <p className="text-sm text-muted-foreground">ID: {item.itemId}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center bg-primary/10 p-2 rounded-full">
              <Warehouse className="h-5 w-5 text-primary" />
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8 rounded-full"
              onClick={() => setProductListingOpen(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Adicionar Compra</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Estoque Total</p>
            <p className="text-xl font-semibold">{actualInventory} unidades</p>
            <p className="text-xs text-muted-foreground">(Compras: {item.totalQuantity} - Vendas: {salesCount})</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Custo Médio</p>
            <p className="text-xl font-semibold">R$ {weightedAverageCost.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">Valor Total em Estoque</p>
          <p className="text-lg font-semibold text-primary">R$ {totalInventoryValue.toFixed(2)}</p>
        </div>
        
        <div className="mb-4 flex items-center gap-1">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Vendas no anúncio dês da primeira reposição</p>
          <p className="text-lg font-semibold ml-auto">{salesCount} unidades</p>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Histórico de Compras</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qtd.</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Source_id</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchasesWithSales.map((purchase, index) => (
                <TableRow key={`${purchase.sourceId}-${index}`}>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>{purchase.salesAssigned || 0}</TableCell>
                  <TableCell>R$ {purchase.unitCost.toFixed(2)}</TableCell>
                  <TableCell>R$ {purchase.totalCost.toFixed(2)}</TableCell>
                  <TableCell>{purchase.sourceId}</TableCell>
                  <TableCell>{purchase.date || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Product listing popup with pre-selected product */}
        <ProductListingPopup 
          open={productListingOpen}
          onClose={() => setProductListingOpen(false)}
          sellerId={sellerId}
          onSelectProduct={handleProductSelect}
          preselectedProduct={productForListing}
          showValueInput={true}
          onAddPurchase={handleAddPurchase}
        />
      </CardContent>
    </Card>
  );
}
