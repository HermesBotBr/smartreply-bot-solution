
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Calendar, Package } from 'lucide-react';

interface DetailedSale {
  orderId: string;
  itemId: string;
  title?: string;
  quantity: number;
  dateCreated: string;
}

interface SalesDetailPopupProps {
  open: boolean;
  onClose: () => void;
  salesByItemId: Record<string, number>;
  detailedSales: DetailedSale[];
  startDate?: Date;
  endDate?: Date;
  totalUnitsSold: number;
}

export function SalesDetailPopup({
  open,
  onClose,
  salesByItemId,
  detailedSales,
  startDate,
  endDate,
  totalUnitsSold
}: SalesDetailPopupProps) {
  // Format date range for display
  const dateRangeText = startDate && endDate
    ? `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
    : 'Desde a primeira reposição';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhe de Vendas por Produto
          </DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-4 h-4" /> 
            {dateRangeText}
          </div>
        </DialogHeader>
        
        <div className="bg-muted/30 p-3 rounded-md mb-4">
          <p className="text-sm font-medium">Total de unidades vendidas: <span className="font-bold text-primary">{totalUnitsSold}</span></p>
        </div>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(salesByItemId).length > 0 ? (
                Object.entries(salesByItemId)
                  .sort((a, b) => b[1] - a[1]) // Sort by quantity (highest first)
                  .map(([itemId, quantity]) => {
                    // Find the title for this item from detailedSales
                    const itemSale = detailedSales.find(sale => sale.itemId === itemId);
                    const title = itemSale?.title || 'Produto sem título';
                    
                    return (
                      <div key={itemId} className="border rounded-lg p-3 bg-card hover:bg-accent/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm truncate max-w-[400px]" title={title}>
                              {title}
                            </h4>
                            <p className="text-xs text-muted-foreground">{itemId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{quantity}</p>
                            <p className="text-xs text-muted-foreground">unidades</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda encontrada no período selecionado.
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
