// src/components/financeiro/RepassesPopup.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SettlementTransaction } from "@/hooks/useSettlementData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RepassesPopupProps {
  transactions: SettlementTransaction[];
}

export const RepassesPopup: React.FC<RepassesPopupProps> = ({ transactions }) => {
  return (
<Dialog open={true} onOpenChange={() => {}}>
  <DialogContent className="max-w-5xl w-full">
    <DialogHeader>
      <DialogTitle>Detalhamento de Repasses</DialogTitle>
    </DialogHeader>
    <div className="mt-4 max-h-[500px] overflow-auto">
      <ScrollArea className="w-full">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">ORDER_ID</th>
              <th className="p-2 border">ID do Anúncio</th>
              <th className="p-2 border">Título do Anúncio</th>
              <th className="p-2 border">Unidades</th>
              <th className="p-2 border">Valor Repasse</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(transactions) && transactions.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border">{item.orderId}</td>
                <td className="p-2 border">{(item as any).itemId || '-'}</td>
                <td className="p-2 border">{(item as any).title || '-'}</td>
                <td className="p-2 border">{item.units}</td>
                <td className="p-2 border">R$ {(item.netValue || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  </DialogContent>
</Dialog>

  );
};
