
import React, { useEffect } from 'react';
import { User, MessageCircle } from "lucide-react";
import { usePackClientData } from '@/hooks/usePackClientData';
import { Skeleton } from '@/components/ui/skeleton';
import ProductThumbnail from './ProductThumbnail';
import { toast } from 'sonner';
import { AllPacksRow } from '@/hooks/useAllPacksData';

interface PacksListProps {
  packs: AllPacksRow[];
  isLoading: boolean;
  error: string | null;
  onSelectPack: (packId: string) => void;
  selectedPackId: string | null;
  sellerId: string | null;
  latestMessages: Record<string, string>;
  allMessages: Record<string, any[]>;
  messagesLoading: boolean;
  messagesError: string | null;
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
  messagesError
}) => {
  // Use our hook to fetch client data for each pack
  const { clientDataMap, isLoading: clientDataLoading } = usePackClientData(sellerId, packs);
  
  // Show toast if there's an error loading messages
  useEffect(() => {
    if (messagesError) {
      toast.error("Erro ao carregar mensagens: " + messagesError);
    }
  }, [messagesError]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhum pacote encontrado para este vendedor</p>
      </div>
    );
  }

  // Helper function to check if the last message is from a buyer
  const hasBuyerLastMessage = (packId: string, messages: any[]) => {
    if (!messages || messages.length === 0) return false;
    
    // Sort messages by date and get the last one
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
    );
    
    const lastMessage = sortedMessages[0];
    
    // Check if the last message is from a buyer (user_id will be higher for buyers)
    // This logic checks if the sender is from the buyer side, not the seller
    return lastMessage && lastMessage.from && lastMessage.from.user_id > 0;
  };

  return (
    <div className="divide-y">
      {packs.map((pack) => {
        const clientData = clientDataMap[pack.pack_id];
        const clientName = clientData ? clientData["Nome completo do cliente"] : null;
        const productTitle = clientData ? clientData["Título do anúncio"] : null;
        const itemId = clientData ? clientData["Item ID"] : null;
        const latestMessage = latestMessages[pack.pack_id];
        const packMessages = allMessages[pack.pack_id] || [];
        const isGptPack = pack.gpt === "sim";
        const hasUnreadMessage = hasBuyerLastMessage(pack.pack_id, packMessages);
        
        return (
          <div
            key={pack.pack_id}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              selectedPackId === pack.pack_id ? 'bg-gray-100' : 
              hasUnreadMessage ? 'bg-blue-50 hover:bg-blue-100' : ''
            } ${isGptPack ? 'border-l-4 border-blue-500' : ''}`}
            onClick={() => onSelectPack(pack.pack_id)}
          >
            <div className="flex items-center space-x-3">
              {itemId ? (
                <ProductThumbnail itemId={itemId} sellerId={sellerId} />
              ) : (
                <div className="bg-blue-100 p-2 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {clientDataLoading && !clientData ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium truncate flex items-center">
                      {clientName || `Cliente (Pack ID: ${pack.pack_id})`}
                      {isGptPack && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">GPT</span>}
                      {hasUnreadMessage && (
                        <MessageCircle size={16} className="ml-2 text-blue-600 fill-blue-200" />
                      )}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {productTitle && <p className="truncate font-medium">{productTitle}</p>}
                      <p className={`truncate text-xs ${hasUnreadMessage ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {messagesLoading ? (
                          <Skeleton className="h-2 w-24" />
                        ) : latestMessage ? (
                          latestMessage
                        ) : (
                          "Carregando mensagens..."
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {packMessages.length > 0 ? `${packMessages.length} mensagens` : ""}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PacksList;
