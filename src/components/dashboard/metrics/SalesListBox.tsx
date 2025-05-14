
import React, { useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { SalesItem } from '@/types/metrics';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { SettlementTransaction } from '@/hooks/useSettlementData';

interface SalesListBoxProps {
  salesData: SalesItem[] | undefined;
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  isLoading: boolean;
}

export function SalesListBox({
  salesData,
  settlementTransactions,
  releaseOperationsWithOrder,
  isLoading
}: SalesListBoxProps) {
  // Processar dados para exibir por anúncio
  const salesByItem = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    // Agrupar vendas por item_id
    const items: Record<string, {
      itemId: string;
      title: string;
      totalSales: number;
      salesCount: number;
      totalRepasses: number;
      totalFees: number;
      releasedAmount: number;
      releasedCount: number;
      notReleasedAmount: number;
      notReleasedCount: number;
    }> = {};
    
    // Processar todas as vendas
    salesData.forEach(sale => {
      sale.orders.forEach(order => {
        order.items.forEach(item => {
          const itemId = item.item.id;
          const title = item.item.title || 'Produto sem título';
          const orderValue = item.unit_price * item.quantity;
          
          // Inicializar ou atualizar o item
          if (!items[itemId]) {
            items[itemId] = {
              itemId,
              title,
              totalSales: 0,
              salesCount: 0,
              totalRepasses: 0,
              totalFees: 0,
              releasedAmount: 0,
              releasedCount: 0,
              notReleasedAmount: 0,
              notReleasedCount: 0
            };
          }
          
          // Adicionar valor da venda
          items[itemId].totalSales += orderValue;
          items[itemId].salesCount += item.quantity;
          
          // Calcular repasses do ML para este item
          const orderTransactions = settlementTransactions.filter(
            trans => trans.order_id === order.order_id.toString()
          );
          
          orderTransactions.forEach(trans => {
            // Proporcionar o valor da transação baseado na proporção do item na ordem
            const totalOrderValue = order.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
            const itemProportion = orderValue / totalOrderValue;
            
            if (trans.type === 'payment') {
              items[itemId].totalRepasses += trans.amount * itemProportion;
            } 
            else if (trans.type === 'fee' || trans.type === 'commission') {
              items[itemId].totalFees += Math.abs(trans.amount) * itemProportion;
            }
          });
          
          // Verificar operações liberadas e não liberadas
          const orderReleaseOps = releaseOperationsWithOrder.filter(
            op => op.orderId === order.order_id.toString()
          );
          
          if (orderReleaseOps.length > 0) {
            // Proporcionar o valor liberado baseado na proporção do item na ordem
            const totalOrderValue = order.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
            const itemProportion = orderValue / totalOrderValue;
            
            const totalReleased = orderReleaseOps.reduce((sum, op) => sum + op.amount, 0);
            items[itemId].releasedAmount += totalReleased * itemProportion;
            items[itemId].releasedCount += 1;
          } else {
            // Se não tem operações liberadas, considerar como não liberada
            items[itemId].notReleasedAmount += orderValue;
            items[itemId].notReleasedCount += 1;
          }
        });
      });
    });
    
    // Converter para array e ordenar por total de vendas (decrescente)
    return Object.values(items).sort((a, b) => b.totalSales - a.totalSales);
  }, [salesData, settlementTransactions, releaseOperationsWithOrder]);
  
  if (isLoading) {
    return <div className="py-8 text-center">Carregando dados de vendas...</div>;
  }
  
  if (!salesByItem || salesByItem.length === 0) {
    return <div className="py-8 text-center">Nenhum dado de venda disponível para o período selecionado</div>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Vendas por Anúncio</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anúncio</TableHead>
              <TableHead className="text-right">Vendas Totais</TableHead>
              <TableHead className="text-right">Repasse Total</TableHead>
              <TableHead className="text-right">Taxas (ML)</TableHead>
              <TableHead className="text-right">Liberado</TableHead>
              <TableHead className="text-right">Não Liberado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesByItem.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell className="font-medium">
                  {item.title}
                  <div className="text-xs text-muted-foreground">ID: {item.itemId}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div>R$ {item.totalSales.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{item.salesCount} unid.</div>
                </TableCell>
                <TableCell className="text-right">
                  <div>R$ {item.totalRepasses.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {((item.totalRepasses / item.totalSales) * 100).toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>R$ {item.totalFees.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {((item.totalFees / item.totalSales) * 100).toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>R$ {item.releasedAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.releasedCount} vendas
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>R$ {item.notReleasedAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.notReleasedCount} vendas
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
