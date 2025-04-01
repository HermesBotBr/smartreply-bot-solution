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

  const handleLogout = () => {
    localStorage.removeItem('mlUserToken');
    window.location.href = '/';
  };

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration);
          return Notification.requestPermission().then((permission) => {
            if (permission !== "granted") {
              throw new Error("Permissão para notificações não concedida");
            }
            return registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array("BAbN67uXIrHatd6zRxiQdcSOB4n6g09E4bS7cfszMA7nElaF1zn9d69g5qxnjwVebKVAQBtICDfT0xuPzaOWlhg")
            });
          });
        })
        .then((subscription) => {
          console.log("Usuário inscrito:", subscription);
          fetch("/api/save-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription)
          })
            .then(response => response.json())
            .then(data => console.log("Subscription salva:", data))
            .catch(error => console.error("Erro ao salvar subscription:", error));
        })
        .catch((error) => {
          console.error("Erro durante o registro ou inscrição do push:", error);
        });
    } else {
      console.warn("Service Worker ou Push API não são suportados neste navegador.");
    }
  }, []);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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
