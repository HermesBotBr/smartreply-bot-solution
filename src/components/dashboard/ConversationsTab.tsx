
import React, { useEffect } from 'react';
import ConversationsList from './ConversationsList';
import ChatPanel from './ChatPanel';  // Changed from default import to named import
import SaleDetailsPanel from './SaleDetailsPanel';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ClientData } from '@/hooks/usePackClientData';
import { MlTokenType } from '@/hooks/useMlToken';

interface ConversationsTabProps {
  conversations: any[];
  selectedConv: any;
  setSelectedConv: (conv: any) => void;
  initialAutoScrollDone: boolean;
  setInitialAutoScrollDone: (done: boolean) => void;
  refreshing: boolean;
  readConversations: string[];
  markAsRead: (orderId: string | string[]) => Promise<void>;
  showSaleDetails: boolean;
  setShowSaleDetails: (show: boolean) => void;
  gptIds: string[];
  mlToken: MlTokenType;
  setFullScreenImage: (url: string | null) => void;
  fetchSaleDetails: (packId: string | null, sellerId: string | null) => Promise<void>;
  saleDetails: ClientData | null;
  isLoading: boolean;
  error: string | null;
}

const ConversationsTab: React.FC<ConversationsTabProps> = ({
  conversations,
  selectedConv,
  setSelectedConv,
  initialAutoScrollDone,
  setInitialAutoScrollDone,
  refreshing,
  readConversations,
  markAsRead,
  showSaleDetails,
  setShowSaleDetails,
  gptIds,
  mlToken,
  setFullScreenImage,
  fetchSaleDetails,
  saleDetails,
  isLoading,
  error
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Set up the fetch interval only when the panel is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    if (showSaleDetails && selectedConv) {
      // Initial fetch - safely extract seller_id if mlToken is an object
      const tokenSellerId = 
        typeof mlToken === 'object' && mlToken !== null && 'seller_id' in mlToken 
          ? mlToken.seller_id 
          : null;
      
      fetchSaleDetails(selectedConv.pack_id, tokenSellerId);
      
      // Set up interval
      intervalId = setInterval(() => {
        fetchSaleDetails(selectedConv.pack_id, tokenSellerId);
      }, 20000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showSaleDetails, selectedConv, mlToken, fetchSaleDetails]);

  const handleCloseSaleDetails = () => {
    setShowSaleDetails(false);
  };

  const handleBackFromChat = () => {
    setSelectedConv(null);
  };

  if (isMobile) {
    if (showSaleDetails && selectedConv) {
      return (
        <div className="w-full h-full flex flex-col overflow-hidden">
          <SaleDetailsPanel 
            saleDetails={saleDetails}
            isLoading={isLoading}
            error={error}
            onClose={handleCloseSaleDetails}
            isMobile={true}
          />
        </div>
      );
    } else if (selectedConv) {
      return (
        <div className="w-full h-full flex flex-col overflow-hidden">
          <ChatPanel 
            selectedConv={selectedConv}
            showSaleDetails={showSaleDetails}
            setShowSaleDetails={setShowSaleDetails}
            gptIds={gptIds}
            mlToken={mlToken}
            setFullScreenImage={setFullScreenImage}
            isAtBottom={true}
            initialAutoScrollDone={initialAutoScrollDone}
            setInitialAutoScrollDone={setInitialAutoScrollDone}
            onBack={handleBackFromChat}
            isMobile={true}
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex flex-col overflow-hidden">
          <ConversationsList 
            conversations={conversations}
            selectedConv={selectedConv}
            setSelectedConv={setSelectedConv}
            setInitialAutoScrollDone={setInitialAutoScrollDone}
            refreshing={refreshing}
            readConversations={readConversations}
            markAsRead={markAsRead}
            isMobile={true}
          />
        </div>
      );
    }
  }

  return (
    <>
      <div className="w-1/3 h-screen overflow-hidden">
        <ConversationsList 
          conversations={conversations}
          selectedConv={selectedConv}
          setSelectedConv={setSelectedConv}
          setInitialAutoScrollDone={setInitialAutoScrollDone}
          refreshing={refreshing}
          readConversations={readConversations}
          markAsRead={markAsRead}
          isMobile={false}
        />
      </div>
      
      <div className={`${showSaleDetails ? 'w-1/3' : 'w-2/3'} h-screen overflow-hidden`}>
        <ChatPanel 
          selectedConv={selectedConv}
          showSaleDetails={showSaleDetails}
          setShowSaleDetails={setShowSaleDetails}
          gptIds={gptIds}
          mlToken={mlToken}
          setFullScreenImage={setFullScreenImage}
          isAtBottom={true}
          initialAutoScrollDone={initialAutoScrollDone}
          setInitialAutoScrollDone={setInitialAutoScrollDone}
          isMobile={false}
        />
      </div>
      
      {showSaleDetails && selectedConv && (
        <div className="w-1/3 h-screen overflow-hidden">
          <SaleDetailsPanel 
            saleDetails={saleDetails}
            isLoading={isLoading}
            error={error}
            onClose={handleCloseSaleDetails}
            isMobile={false}
          />
        </div>
      )}
    </>
  );
};

export default ConversationsTab;
