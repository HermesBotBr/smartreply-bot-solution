
import React, { useEffect, useState } from 'react';
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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePushNotification } from "@/hooks/use-push-notification";
import { toast } from '@/hooks/use-toast';

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
    saleDetails,
    showSaleDetails,
    setShowSaleDetails,
    isLoading,
    error,
    fetchSaleDetails
  } = useSaleDetails();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { subscribe, subscription } = usePushNotification();

  const handleLogout = () => {
    localStorage.removeItem('mlUserToken');
    window.location.href = '/';
  };

  useEffect(() => {
    const initPushNotification = async () => {
      try {
        const result = await subscribe();
        if (result) {
          console.log("User subscribed to push notifications:", result.endpoint);
          fetch("/api/save-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
          })
            .then(response => response.json())
            .then(data => console.log("Subscription saved:", data))
            .catch(error => console.error("Error saving subscription:", error));
        }
      } catch (error) {
        console.error("Error during push registration or subscription:", error);
      }
    };
    
    initPushNotification();
  }, [subscribe]);

  let sellerId: string | null = null;
  
  if (mlToken !== null && typeof mlToken === 'object' && 'seller_id' in mlToken) {
    sellerId = (mlToken as { seller_id: string }).seller_id;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile && (
        <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      )}

      <div className={`flex-1 flex w-${isMobile ? 'full' : '[calc(100%-3.5rem)]'} ${isMobile ? 'h-[calc(100vh-56px)]' : 'h-screen'}`}>
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
            mlToken={mlToken || null}
            setFullScreenImage={setFullScreenImage}
            fetchSaleDetails={fetchSaleDetails}
            saleDetails={saleDetails}
            isLoading={isLoading}
            error={error}
          />
        ) : activeTab === 'perguntas' ? (
          <div className="w-full h-full overflow-auto">
            <QuestionsList />
          </div>
        ) : activeTab === 'etiquetas' ? (
          <div className="w-full h-full overflow-auto">
            <EtiquetasList />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
            <MetricsDisplay 
              onOrderClick={(orderId) => {
                const conversation = conversations.find(conv => conv.orderId.toString() === orderId.toString());
                if (conversation) {
                  setSelectedConv(conversation);
                  setActiveTab('conversas');
                } else {
                  console.error('Conversation not found for orderId:', orderId);
                }
              }}
              sellerId={sellerId}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      )}

      <FullScreenImage imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
};

export default UserGiovaniBurgo;
