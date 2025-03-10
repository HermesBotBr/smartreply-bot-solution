
import React, { useState } from 'react';
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import FullScreenImage from "@/components/dashboard/FullScreenImage";
import NavSidebar from "@/components/dashboard/NavSidebar";
import ConversationsTab from "@/components/dashboard/ConversationsTab";
import { useReadConversations } from "@/hooks/useReadConversations";
import { useMlToken } from "@/hooks/useMlToken";
import { useConversations } from "@/hooks/useConversations";
import { useGptIds } from "@/hooks/useGptIds";
import { useSaleDetails } from "@/hooks/useSaleDetails";

const UserGiovaniBurgo = () => {
  const [activeTab, setActiveTab] = useState('conversas');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const { readConversations, markAsRead } = useReadConversations();
  const mlToken = useMlToken();
  const { 
    conversations,
    selectedConv,
    setSelectedConv,
    refreshing,
    initialAutoScrollDone,
    setInitialAutoScrollDone
  } = useConversations();
  const gptIds = useGptIds();
  const {
    orderDetails,
    shippingDetails,
    expandedInfo,
    setExpandedInfo,
    detailedInfo,
    fetchDetailedInfo,
    showSaleDetails,
    setShowSaleDetails,
    fetchSaleDetails
  } = useSaleDetails();

  return (
    <div className="flex h-screen overflow-hidden">
      <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex w-[calc(100%-3.5rem)]">
        {activeTab === 'conversas' ? (
          <ConversationsTab 
            conversations={conversations}
            selectedConv={selectedConv}
            setSelectedConv={setSelectedConv}
            initialAutoScrollDone={initialAutoScrollDone}
            setInitialAutoScrollDone={setInitialAutoScrollDone}
            refreshing={refreshing}
            readConversations={readConversations}
            markAsRead={markAsRead}
            showSaleDetails={showSaleDetails}
            setShowSaleDetails={setShowSaleDetails}
            gptIds={gptIds}
            mlToken={mlToken}
            setFullScreenImage={setFullScreenImage}
            orderDetails={orderDetails}
            shippingDetails={shippingDetails}
            expandedInfo={expandedInfo}
            setExpandedInfo={setExpandedInfo}
            detailedInfo={detailedInfo}
            fetchDetailedInfo={fetchDetailedInfo}
            fetchSaleDetails={fetchSaleDetails}
          />
        ) : activeTab === 'perguntas' ? (
          <div className="w-full h-screen overflow-auto">
            <QuestionsList />
          </div>
        ) : activeTab === 'etiquetas' ? (
          <div className="w-full h-screen overflow-auto">
            <EtiquetasList />
          </div>
        ) : (
          <div className="w-full h-screen overflow-auto">
            <MetricsDisplay onOrderClick={(orderId) => {
              const conversation = conversations.find(conv => conv.orderId.toString() === orderId.toString());
              if (conversation) {
                setSelectedConv(conversation);
                setActiveTab('conversas');
              } else {
                console.error('Conversa não encontrada para orderId:', orderId);
              }
            }} />
          </div>
        )}
      </div>

      <FullScreenImage imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
};

export default UserGiovaniBurgo;
