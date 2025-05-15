import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, ShoppingBag } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { compareBrazilianDates } from '@/lib/utils';

interface InventoryItemCardProps {
  item: InventoryItem;
  salesCount?: number;
}

export function InventoryItemCard({ item, salesCount = 0 }: InventoryItemCardProps) {
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
            <p className="text-sm text-muted-foreground">ID: {item.itemId}</p>
          </div>
          <div className="flex items-center justify-center bg-primary/10 p-2 rounded-full">
            <Warehouse className="h-5 w-5 text-primary" />
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
      </CardContent>
    </Card>
  );
}
