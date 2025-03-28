
import React, { useState } from 'react';
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import FullScreenImage from "@/components/dashboard/FullScreenImage";
import NavSidebar from "@/components/dashboard/NavSidebar";
import ConversationsTab from "@/components/dashboard/ConversationsTab";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const Hermes = () => {
  const [activeTab, setActiveTab] = useState('conversas');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Placeholder data and functions
  const conversations: any[] = [];
  const refreshing = false;
  const readConversations: string[] = [];
  const markAsRead = async (_orderId: string | string[]) => {};
  const gptIds: string[] = [];
  const mlToken = null;
  const orderDetails = null;
  const shippingDetails = null;
  const expandedInfo = false;
  const setExpandedInfo = (_expanded: boolean) => {};
  const detailedInfo = null;
  const fetchDetailedInfo = async (_selectedConv: any, _token: string) => {};
  const fetchSaleDetails = async (_selectedConv: any, _token: string) => {};

  return (
    <div className="flex h-screen overflow-hidden">
      {/* NavSidebar - only show on sides for desktop */}
      {!isMobile && (
        <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main content area - adjust height for mobile to account for bottom navbar */}
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
              console.log('Order clicked:', orderId);
              // Without actual data, we can just log the action
            }} />
          </div>
        )}
      </div>

      {/* Bottom mobile navigation */}
      {isMobile && (
        <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <FullScreenImage imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
};

export default Hermes;
