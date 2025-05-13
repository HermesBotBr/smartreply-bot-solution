
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface InventoryItemCardProps {
  item: InventoryItem;
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  // Calculate weighted average cost
  const weightedAverageCost = item.purchases.reduce((total, purchase) => 
    total + (purchase.unitCost * purchase.quantity), 0) / item.totalQuantity;
  
  // Calculate total inventory value
  const totalInventoryValue = item.totalQuantity * weightedAverageCost;

  // Format date helper function
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString || '-';
    }
  };

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
            <p className="text-xl font-semibold">{item.totalQuantity} unidades</p>
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

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Histórico de Compras</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.purchases.map((purchase, index) => (
                <TableRow key={`${purchase.sourceId}-${index}`}>
                  <TableCell>{formatDate(purchase.date)}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>R$ {purchase.unitCost.toFixed(2)}</TableCell>
                  <TableCell>R$ {purchase.totalCost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
