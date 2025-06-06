import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProductListingPopup } from './ProductListingPopup';
import { useMlToken } from '@/hooks/useMlToken';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';
import ProductThumbnail from '@/components/dashboard/ProductThumbnail';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface InventoryItemCardProps {
  item: InventoryItem;
  salesCount?: number;
  onInventoryUpdated?: () => void;
}

export function InventoryItemCard({ item, salesCount = 0, onInventoryUpdated }: InventoryItemCardProps) {
  const [productListingOpen, setProductListingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);

  // Get seller_id from user token
  const mlToken = useMlToken();
  const sellerId = mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken
    ? (mlToken as { seller_id: string }).seller_id
    : '681274853'; // Default ID if not found

  // Group purchases and withdrawals
  const purchasesOnly = item.purchases.filter(p => p.quantity > 0);
  const withdrawalsOnly = item.purchases.filter(p => p.quantity < 0);
  
  // Calculate total purchases and withdrawals
  const totalPurchases = purchasesOnly.reduce((sum, p) => sum + p.quantity, 0);
  const totalWithdrawals = Math.abs(withdrawalsOnly.reduce((sum, p) => sum + p.quantity, 0));

  // Calculate weighted average cost only from positive purchases
  const weightedAverageCost = purchasesOnly.length > 0 
    ? purchasesOnly.reduce((total, purchase) => total + (purchase.unitCost * purchase.quantity), 0) / totalPurchases
    : 0;
  
  // Calculate actual inventory after sales and withdrawals
  const actualInventory = Math.max(0, item.totalQuantity - salesCount);
  
  // Calculate total inventory value based on actual inventory
  const totalInventoryValue = actualInventory * weightedAverageCost;

  // Calculate sales distribution for each purchase in chronological order
  const purchasesWithSales = [...item.purchases]
    // Sort purchases by date (oldest first) to distribute sales chronologically
    .sort((a, b) => compareBrazilianDates(a.date, b.date))
    // Add the sales distribution to each purchase
    .reduce((acc, purchase) => {
      const previousSalesAssigned = acc.reduce((total, p) => total + (p.salesAssigned || 0), 0);
      const remainingSales = Math.max(0, salesCount - previousSalesAssigned);
      
      // If this is a withdrawal (negative quantity), don't assign any sales to it
      if (purchase.quantity < 0) {
        acc.push({
          ...purchase,
          salesAssigned: 0
        });
        return acc;
      }
      
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

  // Handle deleting a purchase transaction
  const handleDeletePurchase = async (sourceId: string) => {
    try {
      setIsLoading(true);
      
      // Step 1: First fetch the transaction details
      const transDescResponse = await axios.get(`${getNgrokUrl('/trans_desc')}?seller_id=${sellerId}`);
      const transactions = transDescResponse.data;
      
      // Step 2: Find the specific transaction with this sourceId
      const transactionToDelete = transactions.find((trans: any) => trans.source_id === sourceId);
      
      if (!transactionToDelete) {
        throw new Error(`Transaction with source_id ${sourceId} not found`);
      }
      
      // Step 3: Send DELETE request with the complete transaction data in the body
      await axios.delete(getNgrokUrl('/trans_desc'), { 
        data: {
          seller_id: transactionToDelete.seller_id,
          source_id: transactionToDelete.source_id,
          descricao: transactionToDelete.descricao,
          valor: transactionToDelete.valor
        }
      });
      
      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso",
      });
      
      // Reset state
      setDeletingPurchaseId(null);
      
      // Notify parent component to refresh inventory data
      if (onInventoryUpdated) {
        onInventoryUpdated();
      }
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a movimentação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ProductThumbnail itemId={item.itemId} sellerId={sellerId} />
            <div>
              <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {item.itemId}</p>
            </div>
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
            <p className="text-xs text-muted-foreground">
              (Compras: {totalPurchases} - Retiradas: {totalWithdrawals} - Vendas: {salesCount})
            </p>
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
          <h4 className="text-sm font-medium mb-2">Histórico de Movimentações</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qtd.</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Source_id</TableHead>
                <TableHead>Data</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchasesWithSales.map((purchase, index) => (
                <TableRow key={`${purchase.sourceId}-${index}`} className={purchase.quantity < 0 ? "bg-red-50" : ""}>
                  <TableCell className={purchase.quantity < 0 ? "text-red-600 font-medium" : ""}>
                    {purchase.quantity}
                  </TableCell>
                  <TableCell>{purchase.salesAssigned || 0}</TableCell>
                  <TableCell>R$ {purchase.unitCost.toFixed(2)}</TableCell>
                  <TableCell className={purchase.totalCost < 0 ? "text-red-600" : ""}>
                    R$ {purchase.totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell>{purchase.sourceId}</TableCell>
                  <TableCell>{purchase.date || '-'}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir movimentação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta movimentação?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeletePurchase(purchase.sourceId)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
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
