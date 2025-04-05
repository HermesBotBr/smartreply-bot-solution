
import React, { useState } from 'react';
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePackData } from '@/hooks/usePackData';
import { usePackClientData, ClientData } from '@/hooks/usePackClientData';
import { toast } from "sonner";
import { formatDate } from '@/utils/dateFormatters';

interface PacksListProps {
  packs: any[];
  isLoading: boolean;
  error: string | null;
  onSelectPack: (packId: string) => void;
  selectedPackId: string | null;
  sellerId: string | null;
  latestMessages: Record<string, string>;
  allMessages: Record<string, any[]>;
  messagesLoading: boolean;
  messagesError: string | null;
  readConversations?: string[];
}

const PacksList: React.FC<PacksListProps> = ({
  packs,
  isLoading,
  error,
  onSelectPack,
  selectedPackId,
  sellerId,
  latestMessages,
  allMessages,
  messagesLoading,
  messagesError,
  readConversations = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshingPack, setRefreshingPack] = useState<string | null>(null);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredPacks = packs.filter(pack => {
    const packIdMatch = pack.pack_id.toLowerCase().includes(searchTerm.toLowerCase());
    const nicknameMatch = pack.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = pack.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return packIdMatch || nicknameMatch || emailMatch;
  });
  
  const refreshPack = async (packId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingPack(packId);
    
    try {
      const response = await fetch('/api/force-refresh-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          seller_id: sellerId,
          pack_id: packId 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Mensagens atualizadas com sucesso");
      } else {
        toast.error(`Erro ao atualizar: ${data.error || 'Falha desconhecida'}`);
      }
    } catch (error) {
      console.error("Error refreshing pack:", error);
      toast.error("Erro ao atualizar mensagens");
    } finally {
      setRefreshingPack(null);
    }
  };
  
  const hasUnreadMessages = (packId: string): boolean => {
    return !readConversations.includes(packId);
  };
  
  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Erro ao carregar os pacotes: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar pacotes..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredPacks.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhum pacote encontrado
          </div>
        ) : (
          <div className="divide-y">
            {filteredPacks.map((pack) => {
              const isSelected = selectedPackId === pack.pack_id;
              const hasUnread = hasUnreadMessages(pack.pack_id);
              const latestMessage = latestMessages[pack.pack_id] || '';
              const messageCount = allMessages[pack.pack_id]?.length || 0;
              
              return (
                <div
                  key={pack.pack_id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50' : 
                    hasUnread ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => onSelectPack(pack.pack_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className={`font-medium ${hasUnread ? 'text-blue-700' : 'text-gray-900'}`}>
                          {pack.nickname || pack.pack_id}
                          {hasUnread && <span className="inline-block ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        ID: {pack.pack_id}
                      </p>
                      {messageCount > 0 ? (
                        <p className={`mt-1 text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {truncateText(latestMessage)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-400 italic">
                          Nenhuma mensagem
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 p-0 h-8 w-8"
                      onClick={(e) => refreshPack(pack.pack_id, e)}
                      disabled={refreshingPack === pack.pack_id}
                    >
                      <RefreshCw 
                        size={16} 
                        className={`${refreshingPack === pack.pack_id ? 'animate-spin' : ''}`} 
                      />
                      <span className="sr-only">Atualizar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PacksList;
