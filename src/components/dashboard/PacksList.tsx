
import React, { useEffect, useRef, useCallback } from 'react';
import { User, AlertTriangle } from "lucide-react";
import { usePackClientData } from '@/hooks/usePackClientData';
import { Skeleton } from '@/components/ui/skeleton';
import ProductThumbnail from './ProductThumbnail';
import { toast } from 'sonner';
import { AllPacksRow } from '@/hooks/useAllPacksData';

interface PacksListProps {
  packs: AllPacksRow[] | any[]; // Alterado para aceitar qualquer array para acomodar reclamações
  isLoading: boolean;
  error: string | null;
  onSelectPack: (packId: string, isComplaint?: boolean, claimId?: number) => void;
  selectedPackId: string | null;
  sellerId: string | null;
  latestMessages: Record<string, string>;
  allMessages: Record<string, any[]>;
  messagesLoading: boolean;
  messagesError: string | null;
  readConversations?: string[]; // Array of pack IDs that have been read
  loadMorePacks?: () => void;
  hasMore?: boolean;
  currentFilter?: string;
  complaintsMessages?: Record<string, any[]>;
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
  readConversations = [], // Default to empty array if not provided
  loadMorePacks,
  hasMore = false,
  currentFilter,
  complaintsMessages = {}
}) => {
  // Use our hook to fetch client data for each pack
  const { clientDataMap, isLoading: clientDataLoading } = usePackClientData(sellerId, packs);
  
  // Create a ref for the last list item to observe for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPackElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && loadMorePacks) {
        loadMorePacks();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMorePacks]);
  
  // Show toast if there's an error loading messages
  useEffect(() => {
    if (messagesError) {
      toast.error("Erro ao carregar mensagens: " + messagesError);
    }
  }, [messagesError]);
  
  if (isLoading && packs.length === 0) {
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

  const getSenderLabel = (packId: string) => {
    if (!packId) return "";
    
    // Verificar se estamos no filtro de reclamações
    if (currentFilter === 'complaints') {
      // Extrair o claim_id se este for um pacote de reclamação
      let claimId: string | null = null;
      
      // Pacotes de reclamação sem pack_id usam formato claim-{claim_id}
      if (typeof packId === 'string' && packId.startsWith('claim-')) {
        claimId = packId.replace('claim-', '');
      } else {
        // Procurar pelo pack normal nas reclamações para obter o claim_id
        const complaint = packs.find(p => p.pack_id === packId && p.is_complaint);
        if (complaint && complaint.claim_id) {
          claimId = complaint.claim_id.toString();
        }
      }
      
      // Se encontramos o claim_id e temos mensagens para ele
      if (claimId && complaintsMessages[claimId] && complaintsMessages[claimId].length > 0) {
        const latestMessage = complaintsMessages[claimId][0]; // Assumindo que estão ordenadas
        
        // Determinar o remetente (vendedor ou comprador)
        return latestMessage.sender_role === 'respondent' ? "Seller: " : "Buyer: ";
      }
      
      return "Reclamação: ";
    }
    
    // Lógica original para mensagens normais
    const packMessages = allMessages[packId] || [];
    
    if (packMessages.length === 0) {
      return "";
    }
    
    // Sort messages by date to find the latest one
    const sortedMessages = [...packMessages].sort((a, b) => 
      new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
    );
    
    // Get the latest message
    const latestMessage = sortedMessages[0];
    
    if (!latestMessage) return "";
    
    // Determine if the message is from buyer, seller, or GPT
    const fromUserId = latestMessage.from?.user_id;
    
    if (!fromUserId) return "";
    
    // Find the pack data to check if it's a GPT pack
    const currentPack = packs.find(p => p.pack_id === packId);
    const isGptPack = currentPack?.gpt === "sim";
    
    // If latest message was sent by seller (to customer)
    if (sellerId && fromUserId.toString() === sellerId) {
      // Check if it's from GPT
      if (isGptPack && typeof latestMessage.text === 'string' && latestMessage.text.startsWith('[GPT]')) {
        return "GPT: ";
      }
      return "Seller: ";
    } else {
      // If message was sent by buyer (to seller)
      return "Buyer: ";
    }
  };

  // Function to get the latest message text for a pack
  const getLatestMessageText = (packId: string) => {
    if (!packId) return "";
    
    // Caso especial para reclamações
    if (currentFilter === 'complaints') {
      let claimId: string | null = null;
      
      // Extrair claim_id de pacotes de reclamação
      if (typeof packId === 'string' && packId.startsWith('claim-')) {
        claimId = packId.replace('claim-', '');
      } else {
        const complaint = packs.find(p => p.pack_id === packId && p.is_complaint);
        if (complaint && complaint.claim_id) {
          claimId = complaint.claim_id.toString();
        }
      }
      
      // Se encontramos mensagens para essa reclamação
      if (claimId && complaintsMessages[claimId] && complaintsMessages[claimId].length > 0) {
        // Pegar a mensagem mais recente
        const message = complaintsMessages[claimId][0]; // Assumindo que estão ordenadas
        return message.message || "";
      }
      
      // Se não encontrarmos mensagens, mas temos o pacote de reclamação
      const complaint = packs.find(p => {
        if (!p || !p.is_complaint) return false;
        
        // Verificar se é o pacote correto comparando o pack_id
        if (p.pack_id === packId) return true;
        
        // Verificar se é uma reclamação com formato claim-{id}
        if (typeof packId === 'string' && packId.startsWith('claim-')) {
          const claimIdFromPackId = parseInt(packId.replace('claim-', ''), 10);
          return p.claim_id === claimIdFromPackId;
        }
        
        return false;
      });
      
      if (complaint) {
        return complaint.complaint_reason || "Reclamação sem motivo especificado";
      }
      
      return "Carregando detalhes da reclamação...";
    }
    
    // Lógica original para mensagens normais
    return latestMessages[packId] || "";
  };

  // Function to check if a pack has an unread buyer message
  const hasUnreadBuyerMessage = (packId: string): boolean => {
    if (!packId) return false;
    
    // Caso especial para reclamações
    if (currentFilter === 'complaints') {
      // Por padrão, marcar reclamações como não lidas para chamar a atenção
      return true;
    }
    
    // Get sender label to check if the latest message is from the buyer
    const senderPrefix = getSenderLabel(packId);
    if (senderPrefix !== "Buyer: ") {
      return false;
    }
    
    // Get the latest message ID to check if this specific message is read
    const packMessages = allMessages[packId] || [];
    if (packMessages.length === 0) {
      return false;
    }
    
    // Sort messages by date to find the latest one
    const sortedMessages = [...packMessages].sort((a, b) => 
      new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
    );
    
    // Get the latest message ID
    const latestMessage = sortedMessages[0];
    if (!latestMessage || !latestMessage.id) {
      return false;
    }
    
    // Check if this specific message ID has been read
    const specificMessageReadState = `${packId}:${latestMessage.id}`;
    return !readConversations.includes(specificMessageReadState);
  };

  // Sort the packs: unread buyer messages first, then by latest message date
  const sortedPacks = [...packs].sort((a, b) => {
    // Verificar se temos packs válidos
    if (!a || !b || !a.pack_id || !b.pack_id) return 0;
    
    // First priority: unread buyer messages at the top
    const aHasUnread = hasUnreadBuyerMessage(a.pack_id);
    const bHasUnread = hasUnreadBuyerMessage(b.pack_id);
    
    if (aHasUnread && !bHasUnread) return -1;
    if (!aHasUnread && bHasUnread) return 1;
    
    // Second priority: sort by latest message date
    // Para reclamações, usamos a data da reclamação
    if (currentFilter === 'complaints') {
      const aDate = a.date_msg ? new Date(a.date_msg).getTime() : 0;
      const bDate = b.date_msg ? new Date(b.date_msg).getTime() : 0;
      return bDate - aDate; // Most recent first
    }
    
    // Para mensagens normais, usamos a mesma lógica de antes
    const aMessages = allMessages[a.pack_id] || [];
    const bMessages = allMessages[b.pack_id] || [];
    
    const aDate = aMessages.length > 0 
      ? new Date(aMessages.sort((x, y) => 
          new Date(y.message_date.created).getTime() - new Date(x.message_date.created).getTime()
        )[0].message_date.created).getTime() 
      : 0;
    
    const bDate = bMessages.length > 0 
      ? new Date(bMessages.sort((x, y) => 
          new Date(y.message_date.created).getTime() - new Date(x.message_date.created).getTime()
        )[0].message_date.created).getTime() 
      : 0;
    
    return bDate - aDate; // Most recent first
  });

  return (
    <div className="divide-y">
      {sortedPacks.map((pack, index) => {
        if (!pack || !pack.pack_id) return null;
        
        const clientData = clientDataMap[pack.pack_id];
        const clientName = clientData ? clientData["Nome completo do cliente"] : null;
        const productTitle = clientData ? clientData["Título do anúncio"] : null;
        const itemId = clientData ? clientData["Item ID"] : null;
        const latestMessage = getLatestMessageText(pack.pack_id);
        const packMessages = allMessages[pack.pack_id] || [];
        const isGptPack = typeof pack.gpt === 'string' && pack.gpt === "sim";
        const senderLabel = getSenderLabel(pack.pack_id);
        const isUnread = hasUnreadBuyerMessage(pack.pack_id);
        const isComplaint = pack.is_complaint || false;
        
        // Add ref to last item for infinite scrolling
        const isLastItem = index === sortedPacks.length - 1;
        
        return (
          <div
            key={pack.pack_id}
            ref={isLastItem ? lastPackElementRef : null}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              selectedPackId === pack.pack_id ? 'bg-gray-100' : 
              isUnread ? 'bg-blue-50 hover:bg-blue-100' : ''
            } ${isGptPack ? 'border-l-4 border-blue-500' : ''} ${isComplaint ? 'border-l-4 border-orange-500' : ''}`}
            onClick={() => onSelectPack(
              pack.pack_id, 
              isComplaint, 
              isComplaint ? pack.claim_id : undefined
            )}
          >
            <div className="flex items-center space-x-3">
              {itemId ? (
                <ProductThumbnail itemId={itemId} sellerId={sellerId} />
              ) : (
                <div className={`${isComplaint ? 'bg-orange-100' : 'bg-blue-100'} p-2 rounded-full`}>
                  {isComplaint ? (
                    <AlertTriangle size={20} className="text-orange-600" />
                  ) : (
                    <User size={20} className="text-blue-600" />
                  )}
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
                    <h3 className={`font-medium truncate ${isUnread ? 'text-blue-700' : 'text-gray-900'}`}>
                      {clientName || (isComplaint ? `Reclamação #${pack.claim_id || pack.order_id}` : `Cliente (Pack ID: ${pack.pack_id})`)}
                      {isGptPack && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">GPT</span>}
                      {isComplaint && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Reclamação</span>}
                      {isUnread && <span className="inline-block ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {productTitle && <p className="truncate font-medium">{productTitle}</p>}
                      {isComplaint && pack.complaint_reason && (
                        <p className="truncate text-xs font-medium text-orange-600">
                          Motivo: {pack.complaint_reason}
                        </p>
                      )}
                      <p className="truncate text-xs text-gray-400">
                        {messagesLoading ? (
                          <Skeleton className="h-2 w-24" />
                        ) : latestMessage ? (
                          <>
                            <span className={`font-medium ${
                              senderLabel.startsWith('Buyer') ? 'text-blue-600' : 
                              senderLabel.startsWith('GPT') ? 'text-green-600' :
                              senderLabel.startsWith('Reclamação') ? 'text-orange-600' : 
                              'text-gray-600'
                            }`}>
                              {senderLabel}
                            </span>
                            {latestMessage}
                          </>
                        ) : (
                          "Carregando mensagens..."
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {!isComplaint && packMessages.length > 0 ? `${packMessages.length} mensagens` : ""}
                        {isComplaint && pack.data_criada && (
                          `Aberta em: ${new Date(pack.data_criada).toLocaleDateString('pt-BR')}`
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {isLoading && packs.length > 0 && (
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando mais conversas...</p>
        </div>
      )}
    </div>
  );
};

export default PacksList;
