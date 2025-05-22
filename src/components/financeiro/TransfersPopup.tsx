import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { TransactionsList } from './TransactionsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { useMlToken } from '@/hooks/useMlToken';
import { ProductListingPopup } from './ProductListingPopup';
import { getNgrokUrl } from '@/config/api';

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
  startDate?: Date;  // Adicionando data inicial do filtro
  endDate?: Date;    // Adicionando data final do filtro
}

interface TransferDescription {
  description: string;
  value: number;
}

interface TransferWithDescriptions extends ReleaseOperation {
  manualDescriptions: TransferDescription[];
}

interface ApiDescription {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
}

// Define a transaction interface that matches what we're creating
interface TransferTransaction {
  date: string;
  sourceId: string;
  descriptions: string[];
  group: string;
  value: number;
  totalDeclared: number;
  manualDescriptions: TransferDescription[];
}

interface Product {
  mlb: string;
  title: string;
  image: string;
  active: boolean;
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers,
  startDate,
  endDate
}) => {
  const [transfersWithDescriptions, setTransfersWithDescriptions] = useState<TransferWithDescriptions[]>([]);
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [productListingOpen, setProductListingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Obter o seller_id do usuário logado
  const mlToken = useMlToken();
  const sellerId = mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken
    ? (mlToken as { seller_id: string }).seller_id
    : '681274853'; // ID padrão caso não encontre
  
  // Carregar descrições do endpoint quando o popup é aberto
  useEffect(() => {
    if (open) {
      fetchDescriptions();
    }
  }, [open]);
  
  // Atualizar a lista de transferências quando as transferências mudam
  useEffect(() => {
    setTransfersWithDescriptions(
      transfers.map(transfer => ({
        ...transfer,
        manualDescriptions: []
      }))
    );
  }, [transfers]);

  // Buscar descrições da API
  const fetchDescriptions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${getNgrokUrl('/trans_desc')}`, {
        params: {
          seller_id: sellerId
        }
      });
      const apiDescriptions: ApiDescription[] = response.data;
      
      // Mapear as descrições da API para o formato usado no componente
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          const sourceId = transfer.sourceId || '';
          const matchingDescriptions = apiDescriptions
            .filter(desc => desc.source_id === sourceId)
            .map(desc => ({
              description: desc.descricao,
              value: parseFloat(desc.valor)
            }));
          
          return {
            ...transfer,
            manualDescriptions: matchingDescriptions
          };
        })
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar descrições:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar descrições",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Lidar com seleção de produto
  const handleProductSelect = (product: Product, quantity: number) => {
    const productDescription = `Compra de mercadoria: ${quantity}x ${product.title} (${product.mlb})`;
    setNewDescription(productDescription);
    setProductListingOpen(false);
  };

  // Adicionar nova descrição
  const handleAddDescription = async () => {
    if (!activeTransferId || !newDescription.trim() || !newValue.trim()) return;
    
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (isNaN(numericValue)) return;
    
    try {
      setIsLoading(true);
      
      // Enviar descrição para a API
      await axios.post(getNgrokUrl('/trans_desc'), {
        seller_id: sellerId,
        source_id: activeTransferId,
        descricao: newDescription,
        valor: numericValue.toString()
      });
      
      // Atualizar estado local após o sucesso da API
      await fetchDescriptions();
      
      setNewDescription("");
      setNewValue("");
      setDescriptionDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Descrição adicionada com sucesso",
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar descrição",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Remover descrição
  const handleRemoveDescription = async (transferId: string, descriptionIndex: number) => {
    try {
      const transfer = transfersWithDescriptions.find(t => t.sourceId === transferId);
      if (!transfer) return;
      
      const descriptionToRemove = transfer.manualDescriptions[descriptionIndex];
      
      setIsLoading(true);
      
      // Remover descrição da API
      await axios.delete(getNgrokUrl('/trans_desc'), {
        data: {
          seller_id: sellerId,
          source_id: transferId,
          descricao: descriptionToRemove.description,
          valor: descriptionToRemove.value.toString()
        }
      });
      
      // Atualizar estado local após o sucesso da API
      await fetchDescriptions();
      
      toast({
        title: "Sucesso",
        description: "Descrição removida com sucesso",
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao remover descrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover descrição",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Função para verificar se uma data está dentro do intervalo selecionado
  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr || !startDate || !endDate) return true;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return true; // Se a data for inválida, mostre a transferência
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return date >= start && date <= end;
    } catch (error) {
      console.error("Erro ao verificar intervalo de data:", error);
      return true; // Em caso de erro, inclua a transferência
    }
  };

  // Calculate declared total for a transfer
  const getDeclaredTotal = (transfer: TransferWithDescriptions) => {
    return transfer.manualDescriptions.reduce((sum, desc) => sum + desc.value, 0);
  };

  // Convert to transactions for the TransactionsList component
  const transferTransactions: TransferTransaction[] = transfersWithDescriptions.map(transfer => {
    const totalDeclared = getDeclaredTotal(transfer);
    return {
      date: transfer.date || new Date().toISOString(),
      sourceId: transfer.sourceId || '',
      descriptions: transfer.manualDescriptions.map(desc => desc.description),
      group: 'Transferência',
      value: transfer.amount,
      totalDeclared,
      manualDescriptions: transfer.manualDescriptions,
    };
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento de Transferências</DialogTitle>
          <DialogDescription>
            Lista de todas as transferências registradas no período selecionado
          </DialogDescription>
        </DialogHeader>
        <div>
          {/* Renderização da tabela e pop-up */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
