
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RepassesPopupProps {
  open: boolean;
  onClose: () => void;
  data: string;
  onDataChange: (value: string) => void;
  onSave: () => void;
}

export function RepassesPopup({ open, onClose, data, onDataChange, onSave }: RepassesPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inserir Dados de Repasses</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Insira os dados de repasses no formato CSV..."
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
