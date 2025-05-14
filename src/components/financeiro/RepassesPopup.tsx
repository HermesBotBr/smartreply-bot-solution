
// src/components/financeiro/RepassesPopup.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementTransaction } from "@/hooks/useSettlementData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RepassesPopupProps {
  transactions: SettlementTransaction[];
  open: boolean;
  onClose: () => void;
  startDate?: Date;  // Add startDate prop
  endDate?: Date;    // Add endDate prop
}

export const RepassesPopup: React.FC<RepassesPopupProps> = ({ 
  transactions, 
  open, 
  onClose,
  startDate,
  endDate 
}) => {
  const [groupedView, setGroupedView] = useState(false);

  // Filter transactions based on date range if provided
  const filteredTransactions = startDate && endDate 
    ? transactions.filter(transaction => {
        if (!transaction.date) return true; // Keep transactions without a date
        
        try {
          const transDate = new Date(transaction.date);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          return transDate >= start && transDate <= end;
        } catch (error) {
          console.error('Error filtering by date range in RepassesPopup:', error);
          return true; // Include if there's an error parsing the date
        }
      })
    : transactions;

  const groupedData = filteredTransactions.reduce((acc, item) => {
    const key = item.itemId || "unknown";
    if (!acc[key]) {
      acc[key] = {
        itemId: item.itemId || '-',
        title: item.title || '-',
        units: 0,
        netValue: 0
      };
    }
    acc[key].units += item.units;
    acc[key].netValue += item.netValue || 0;
    return acc;
  }, {} as Record<string, { itemId: string; title: string; units: number; netValue: number }>);

  const groupedList = Object.values(groupedData);

  // Format date range for display
  const dateRangeText = startDate && endDate 
    ? `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
    : 'Período completo';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>
            Detalhamento de Repasses
            {startDate && endDate && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {dateRangeText}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Switch id="toggle-view" checked={groupedView} onCheckedChange={setGroupedView} />
          <Label htmlFor="toggle-view">Agrupar por Anúncio</Label>
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
                  <th className="p-2 border">Valor Repasse</th>
                </tr>
              </thead>
              <tbody>
                {groupedView ? (
                  groupedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.itemId}</td>
                      <td className="p-2 border">{item.title}</td>
                      <td className="p-2 border">{item.units}</td>
                      <td className="p-2 border">R$ {item.netValue.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  filteredTransactions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.orderId}</td>
                      <td className="p-2 border">{item.itemId || '-'}</td>
                      <td className="p-2 border">{item.title || '-'}</td>
                      <td className="p-2 border">{item.units}</td>
                      <td className="p-2 border">R$ {(item.netValue || 0).toFixed(2)}</td>
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
