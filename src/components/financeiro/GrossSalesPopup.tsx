
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementTransaction } from "@/hooks/useSettlementData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GrossSalesPopupProps {
  transactions: SettlementTransaction[];
  open: boolean;
  onClose: () => void;
  startDate?: Date;
  endDate?: Date;
}

export const GrossSalesPopup: React.FC<GrossSalesPopupProps> = ({ 
  transactions, 
  open, 
  onClose,
  startDate,
  endDate 
}) => {
  const [groupedView, setGroupedView] = useState(false);
  
  // Group data by item ID for grouped view
  const groupedData = transactions.reduce((acc, item) => {
    const key = item.itemId || "unknown";
    if (!acc[key]) {
      acc[key] = {
        itemId: item.itemId || '-',
        title: item.title || '-',
        units: 0,
        grossValue: 0
      };
    }
    acc[key].units += item.units;
    acc[key].grossValue += item.grossValue || 0;
    return acc;
  }, {} as Record<string, { itemId: string; title: string; units: number; grossValue: number }>);

  const groupedList = Object.values(groupedData);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento Bruto</DialogTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}
            </p>
          )}
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Switch id="toggle-gross-view" checked={groupedView} onCheckedChange={setGroupedView} />
          <Label htmlFor="toggle-gross-view">Agrupar por Anúncio</Label>
        </div>

        <div className="mt-2 max-h-[500px] overflow-auto">
          <ScrollArea className="w-full">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {!groupedView && <th className="p-2 border">ORDER_ID</th>}
                  <th className="p-2 border">ID do Anúncio</th>
                  <th className="p-2 border">Título do Anúncio</th>
                  <th className="p-2 border">Unidades</th>
                  <th className="p-2 border">Valor Bruto</th>
                </tr>
              </thead>
              <tbody>
                {groupedView ? (
                  groupedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.itemId}</td>
                      <td className="p-2 border">{item.title}</td>
                      <td className="p-2 border">{item.units}</td>
                      <td className="p-2 border">R$ {item.grossValue.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  transactions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.orderId}</td>
                      <td className="p-2 border">{item.itemId || '-'}</td>
                      <td className="p-2 border">{item.title || '-'}</td>
                      <td className="p-2 border">{item.units}</td>
                      <td className="p-2 border">R$ {(item.grossValue || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
