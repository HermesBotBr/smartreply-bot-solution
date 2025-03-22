
import React, { useEffect } from 'react';
import ConversationsList from './ConversationsList';
import ChatPanel from './ChatPanel';
import SaleDetailsPanel from './SaleDetailsPanel';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  mlToken: string | null;
  setFullScreenImage: (url: string | null) => void;
  orderDetails: any;
  shippingDetails: any;
  expandedInfo: boolean;
  setExpandedInfo: (expanded: boolean) => void;
  detailedInfo: any;
  fetchDetailedInfo: (selectedConv: any, token: string) => Promise<void>;
  fetchSaleDetails: (selectedConv: any, token: string) => Promise<void>;
  resetDetails?: () => void;
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
  orderDetails,
  shippingDetails,
  expandedInfo,
  setExpandedInfo,
  detailedInfo,
  fetchDetailedInfo,
  fetchSaleDetails,
  resetDetails
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Set up the fetch interval only when the panel is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (showSaleDetails && selectedConv && mlToken) {
      // Initial fetch
      fetchSaleDetails(selectedConv, mlToken);
      
      // Set up interval
      intervalId = setInterval(() => {
        if (mlToken) {
          fetchSaleDetails(selectedConv, mlToken);
        }
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
            selectedConv={selectedConv}
            orderDetails={orderDetails}
            shippingDetails={shippingDetails}
            expandedInfo={expandedInfo}
            setExpandedInfo={setExpandedInfo}
            detailedInfo={detailedInfo}
            fetchDetailedInfo={() => mlToken && fetchDetailedInfo(selectedConv, mlToken)}
            onClose={handleCloseSaleDetails}
            markAsRead={markAsRead}
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
            selectedConv={selectedConv}
            orderDetails={orderDetails}
            shippingDetails={shippingDetails}
            expandedInfo={expandedInfo}
            setExpandedInfo={setExpandedInfo}
            detailedInfo={detailedInfo}
            fetchDetailedInfo={() => mlToken && fetchDetailedInfo(selectedConv, mlToken)}
            onClose={handleCloseSaleDetails}
            markAsRead={markAsRead}
            isMobile={false}
          />
        </div>
      )}
    </>
  );
};

export default ConversationsTab;
