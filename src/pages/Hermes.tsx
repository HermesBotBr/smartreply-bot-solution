
import React, { useState, useEffect } from 'react';
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import FullScreenImage from "@/components/dashboard/FullScreenImage";
import NavSidebar from "@/components/dashboard/NavSidebar";
import ConversationsTab from "@/components/dashboard/ConversationsTab";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import HermesLogin from "@/components/dashboard/HermesLogin";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePackData } from "@/hooks/usePackData";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePackMessages } from "@/hooks/usePackMessages";
import PacksList from "@/components/dashboard/PacksList";
import MessagesList from "@/components/dashboard/MessagesList";

const Hermes = () => {
  const [activeTab, setActiveTab] = useState('conversas');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  
  // Use our custom hooks to fetch data
  const { packs, isLoading: packsLoading, error: packsError } = usePackData(sellerId);
  const { accessToken, isLoading: tokenLoading, error: tokenError } = useAccessToken(sellerId);
  const { messages, isLoading: messagesLoading, error: messagesError } = usePackMessages(
    selectedPackId, 
    sellerId, 
    accessToken
  );
  
  // Check if user is already authenticated
  useEffect(() => {
    const auth = localStorage.getItem('hermesAuth');
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        if (authData.sellerId && authData.timestamp) {
          // Check if auth is still valid (24 hours)
          const now = new Date().getTime();
          if (now - authData.timestamp < 24 * 60 * 60 * 1000) {
            setIsAuthenticated(true);
            setSellerId(authData.sellerId);
            setLoginOpen(false);
            toast.success("Sessão recuperada");
            return;
          }
        }
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
    // If we get here, either no auth or expired auth
    setIsAuthenticated(false);
    setSellerId(null);
    setLoginOpen(true);
    localStorage.removeItem('hermesAuth');
  }, []);

  // Log when the access token is loaded or updated
  useEffect(() => {
    if (accessToken && !tokenLoading) {
      console.log("Access token available for seller:", sellerId);
      // We don't show this to the user, it's just for internal tracking
    }
  }, [accessToken, tokenLoading, sellerId]);

  const handleLoginSuccess = (sellerId: string) => {
    setIsAuthenticated(true);
    setSellerId(sellerId);
    setLoginOpen(false);
    
    // Save auth data in localStorage with timestamp
    const authData = {
      sellerId,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('hermesAuth', JSON.stringify(authData));
    
    toast.success("Login realizado com sucesso!");
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    // Reset any previous conversation selection
    setSelectedConv(null);
    
    if (accessToken) {
      toast.info(`Carregando mensagens do pacote ${packId}`);
    } else {
      toast.error("Token de acesso não disponível");
    }
  };
  
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
      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <DialogDescription className="sr-only">
            Faça login para acessar o sistema Hermes
          </DialogDescription>
          <HermesLogin onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>

      {/* Only show content if authenticated */}
      {isAuthenticated && (
        <>
          {/* NavSidebar - only show on sides for desktop */}
          {!isMobile && (
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* Main content area - adjust height for mobile to account for bottom navbar */}
          <div className={`flex-1 flex w-${isMobile ? 'full' : '[calc(100%-3.5rem)]'} ${isMobile ? 'h-[calc(100vh-56px)]' : 'h-screen'}`}>
            {activeTab === 'conversas' ? (
              <>
                {/* Left panel - Packs List */}
                <div className="w-1/3 h-full overflow-auto border-r">
                  <div className="p-4 border-b bg-white">
                    <h2 className="text-lg font-medium">Pacotes</h2>
                    <p className="text-sm text-gray-500">Seller ID: {sellerId}</p>
                  </div>
                  <PacksList 
                    packs={packs} 
                    isLoading={packsLoading} 
                    error={packsError}
                    onSelectPack={handleSelectPack}
                    selectedPackId={selectedPackId}
                  />
                </div>
                
                {/* Right panel - Messages or placeholder */}
                <div className="w-2/3 h-full overflow-auto">
                  {selectedPackId ? (
                    <div className="flex flex-col h-full">
                      <div className="p-4 border-b bg-white">
                        <h3 className="text-lg font-medium">Pack ID: {selectedPackId}</h3>
                        <p className="text-sm text-gray-500">
                          {messagesLoading ? 'Carregando mensagens...' : 
                           messagesError ? 'Erro ao carregar mensagens' : 
                           `${messages.length} mensagens`}
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto bg-gray-50">
                        <MessagesList 
                          messages={messages}
                          isLoading={messagesLoading}
                          error={messagesError}
                          sellerId={sellerId}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-6">
                        <h3 className="text-xl font-bold mb-2">Nenhum pacote selecionado</h3>
                        <p className="text-gray-500">
                          Selecione um pacote para ver as mensagens
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
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
        </>
      )}
    </div>
  );
};

export default Hermes;
