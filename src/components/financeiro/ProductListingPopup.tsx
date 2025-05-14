
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ProductListingPopupProps {
  open: boolean;
  onClose: () => void;
  data: string;
  onDataChange: (value: string) => void;
  onSave: () => void;
}

export function ProductListingPopup({ open, onClose, data, onDataChange, onSave }: ProductListingPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inserir Dados de Listagem de Produtos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Insira os dados de listagem de produtos no formato CSV..."
            className="min-h-[300px]"
            value={data}
            onChange={(e) => onDataChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            onSave();
          }}>Salvar Dados</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
