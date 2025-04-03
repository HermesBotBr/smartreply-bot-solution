
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

// Importar a mesma chave VAPID que é usada no rest do aplicativo
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
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Usar o hook usePushNotification em vez de registrar manualmente
  const { subscribe, subscription } = usePushNotification();

  const handleLogout = () => {
    localStorage.removeItem('mlUserToken');
    window.location.href = '/';
  };

  useEffect(() => {
    // Substituir a inicialização manual do service worker e subscrição
    // pelo uso do hook usePushNotification
    const initPushNotification = async () => {
      try {
        const result = await subscribe();
        if (result) {
          console.log("Usuário inscrito para notificações push:", result.endpoint);
          // Salvar a subscription no servidor se necessário
          fetch("/api/save-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
          })
            .then(response => response.json())
            .then(data => console.log("Subscription salva:", data))
            .catch(error => console.error("Erro ao salvar subscription:", error));
        }
      } catch (error) {
        console.error("Erro durante o registro ou inscrição do push:", error);
      }
    };
    
    initPushNotification();
  }, [subscribe]);

  // Remover a função urlBase64ToUint8Array pois já existe no hook

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
          <div className="w-full h-full overflow-auto">
            <QuestionsList />
          </div>
        ) : activeTab === 'etiquetas' ? (
          <div className="w-full h-full overflow-auto">
            <EtiquetasList />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
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

      {isMobile && (
        <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      )}

      <FullScreenImage imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
};

export default UserGiovaniBurgo;
