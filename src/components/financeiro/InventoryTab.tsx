
import React from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProductInventory, ProductStock } from '@/types/Inventory';

interface InventoryTabProps {
  sellerId: string | null;
}

export function InventoryTab({ sellerId }: InventoryTabProps) {
  const { inventory, isLoading, error } = useInventoryData(sellerId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Erro: {error}</p>
      </div>
    );
  }

  const totalInventoryValue = inventory.reduce((acc, item) => acc + item.totalValue, 0);
  const totalProducts = inventory.filter(item => item.totalQuantity > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total em Estoque</CardTitle>
            <CardDescription>Valor total do estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInventoryValue)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Produtos em Estoque</CardTitle>
            <CardDescription>Quantidade de produtos diferentes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Unidades</CardTitle>
            <CardDescription>Quantidade total de itens</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {inventory.reduce((acc, item) => acc + item.totalQuantity, 0)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventário de Produtos</CardTitle>
          <CardDescription>
            Lista de todos os produtos cadastrados e seus estoques atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código (MLB)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo Médio</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Lotes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.product.mlb}>
                    <TableCell className="min-w-[250px]">
                      <div className="flex items-center gap-3">
                        {item.product.image && (
                          <img 
                            src={item.product.image} 
                            alt={item.product.title}
                            className="h-10 w-10 object-cover rounded-md"
                          />
                        )}
                        <span className="font-medium">{item.product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.product.mlb}</TableCell>
                    <TableCell>
                      {item.product.active ? (
                        <Badge variant="success" className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.totalQuantity}</TableCell>
                    <TableCell>
                      {item.averageCost > 0 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.averageCost)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.totalValue > 0 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.stockBatches.length > 0 ? (
                        <div className="space-y-1">
                          {item.stockBatches.map((batch, index) => (
                            <div key={index} className="text-xs">
                              {batch.quantity} un x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(batch.unitCost)}
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhum produto encontrado no estoque
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
