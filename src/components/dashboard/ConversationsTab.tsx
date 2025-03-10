
import React, { useEffect } from 'react';
import ConversationsList from './ConversationsList';
import ChatPanel from './ChatPanel';
import SaleDetailsPanel from './SaleDetailsPanel';

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
  fetchSaleDetails
}) => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (showSaleDetails && selectedConv) {
      intervalId = setInterval(() => {
        if (mlToken) {
          fetchSaleDetails(selectedConv, mlToken);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showSaleDetails, selectedConv, mlToken, fetchSaleDetails]);

  useEffect(() => {
    if (showSaleDetails && selectedConv && mlToken) {
      fetchSaleDetails(selectedConv, mlToken);
    }
  }, [showSaleDetails, selectedConv, mlToken, fetchSaleDetails]);

  const handleCloseSaleDetails = () => {
    setShowSaleDetails(false);
  };

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
          />
        </div>
      )}
    </>
  );
};

export default ConversationsTab;
