
import React, { useState, useEffect } from 'react';
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import NavSidebar from "@/components/dashboard/NavSidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import HermesLogin from "@/components/dashboard/HermesLogin";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePackData } from "@/hooks/usePackData";
import { usePackMessages } from "@/hooks/usePackMessages";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import PacksList from "@/components/dashboard/PacksList";
import MessagesList from "@/components/dashboard/MessagesList";

const Hermes = () => {
  const [activeTab, setActiveTab] = useState('conversas');
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [messagesRefreshTrigger, setMessagesRefreshTrigger] = useState(0);
  
  const { packs, isLoading: packsLoading, error: packsError } = usePackData(sellerId);
  const { messages, isLoading: messagesLoading, error: messagesError, updatePackMessages } = usePackMessages(
    selectedPackId, 
    sellerId,
    messagesRefreshTrigger
  );
  
  // useMessageNotifications agora espera por chamadas externas ao endpoint
  const { testForceRefresh } = useMessageNotifications(sellerId, (packId) => {
    console.log(`Notificação recebida para o pacote ${packId}, atualizando mensagens`);
    updatePackMessages(packId);
    
    if (packId !== selectedPackId) {
      toast.info(`Nova mensagem recebida para o pacote ${packId}`, {
        duration: 3000,
      });
    }
  });
  
  useEffect(() => {
    const auth = localStorage.getItem('hermesAuth');
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        if (authData.sellerId && authData.timestamp) {
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
    setIsAuthenticated(false);
    setSellerId(null);
    setLoginOpen(true);
    localStorage.removeItem('hermesAuth');
  }, []);

  useEffect(() => {
    if (selectedPackId) {
      console.log("Selected pack ID:", selectedPackId, "for seller:", sellerId);
    }
  }, [selectedPackId, sellerId]);

  const handleLoginSuccess = (sellerId: string) => {
    setIsAuthenticated(true);
    setSellerId(sellerId);
    setLoginOpen(false);
    
    const authData = {
      sellerId,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('hermesAuth', JSON.stringify(authData));
    
    toast.success("Login realizado com sucesso!");
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    setSelectedConv(null);
    
    toast.info(`Carregando mensagens do pacote ${packId}`);
  };

  const handleMessageSent = () => {
    setMessagesRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSellerId(null);
    setLoginOpen(true);
    localStorage.removeItem('hermesAuth');
    toast.success("Sessão encerrada com sucesso");
  };

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
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <DialogDescription className="sr-only">
            Faça login para acessar o sistema Hermes
          </DialogDescription>
          <HermesLogin onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>

      {isAuthenticated && (
        <>
          {!isMobile && (
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          )}

          <div className={`flex-1 flex w-${isMobile ? 'full' : '[calc(100%-3.5rem)]'} ${isMobile ? 'h-[calc(100vh-56px)]' : 'h-screen'}`}>
            {activeTab === 'conversas' ? (
              <>
                <div className="w-1/3 h-full overflow-auto border-r">
                  <div className="p-4 border-b bg-white">
                    <h2 className="text-lg font-medium">Clientes</h2>
                    <p className="text-sm text-gray-500">Seller ID: {sellerId}</p>
                  </div>
                  <PacksList 
                    packs={packs} 
                    isLoading={packsLoading} 
                    error={packsError}
                    onSelectPack={handleSelectPack}
                    selectedPackId={selectedPackId}
                    sellerId={sellerId}
                  />
                </div>
                
                <div className="w-2/3 h-full overflow-hidden">
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
                      <div className="flex-1 overflow-hidden bg-gray-50">
                        <MessagesList 
                          messages={messages}
                          isLoading={messagesLoading}
                          error={messagesError}
                          sellerId={sellerId}
                          packId={selectedPackId}
                          onMessageSent={handleMessageSent}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-6">
                        <h3 className="text-xl font-bold mb-2">Nenhum cliente selecionado</h3>
                        <p className="text-gray-500">
                          Selecione um cliente para ver as mensagens
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
                }} />
              </div>
            )}
          </div>

          {isMobile && (
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          )}
        </>
      )}
    </div>
  );
};

export default Hermes;
