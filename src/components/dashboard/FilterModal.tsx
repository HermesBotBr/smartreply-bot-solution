
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterHasMessage: boolean;
  setFilterHasMessage: (value: boolean) => void;
  filterBuyerMessage: boolean;
  setFilterBuyerMessage: (value: boolean) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  filterHasMessage,
  setFilterHasMessage,
  filterBuyerMessage,
  setFilterBuyerMessage
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtrar Conversas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-has-message"
              checked={filterHasMessage}
              onCheckedChange={setFilterHasMessage}
            />
            <label htmlFor="filter-has-message">Com Mensagem</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-buyer-message"
              checked={filterBuyerMessage}
              onCheckedChange={setFilterBuyerMessage}
            />
            <label htmlFor="filter-buyer-message">Mensagem Comprador</label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Aplicar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
