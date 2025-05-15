
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdvertisingItem } from '@/hooks/usePublicidadeData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PublicidadePopupProps {
  open: boolean;
  onClose: () => void;
  advertisingItems: AdvertisingItem[];
  startDate?: Date;
  endDate?: Date;
  totalCost: number;
}

export const PublicidadePopup: React.FC<PublicidadePopupProps> = ({
  open,
  onClose,
  advertisingItems,
  startDate,
  endDate,
  totalCost
}) => {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Date range text
  const dateRangeText = startDate && endDate 
    ? `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
    : 'Período não selecionado';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Publicidade Detalhada - Total: {formatCurrency(totalCost)}
          </DialogTitle>
          <div className="text-sm text-gray-500 mt-1">
            Período: {dateRangeText}
          </div>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anúncio</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisingItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum dado de publicidade encontrado para o período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                advertisingItems.map((item) => (
                  <TableRow key={`${item.item_id}-${item.metrics.cost}`}>
                    <TableCell>
                      <a 
                        href={item.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center hover:underline text-blue-600"
                      >
                        {item.thumbnail && (
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-10 h-10 object-contain mr-2 border rounded"
                          />
                        )}
                        {item.item_id}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={item.title}>
                      {item.title}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.metrics.direct_units_quantity || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.metrics.cost)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
