import React, { useState, useEffect } from 'react';
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import NavSidebar from "@/components/dashboard/NavSidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import HermesLogin from "@/components/dashboard/HermesLogin";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAllPacksData } from "@/hooks/useAllPacksData";
import { usePackMessages } from "@/hooks/usePackMessages";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { usePacksWithMessages } from "@/hooks/usePacksWithMessages";
import { usePackClientData } from "@/hooks/usePackClientData";
import PacksList from "@/components/dashboard/PacksList";
import MessagesList from "@/components/dashboard/MessagesList";
import NotificationPermission from "@/components/NotificationPermission";
import ConfigurationsPanel from "@/components/dashboard/ConfigurationsPanel";
import SaleDetailsPanel from "@/components/dashboard/SaleDetailsPanel";
import { useSaleDetails } from "@/hooks/useSaleDetails";
import PacksFilterBar from "@/components/dashboard/PacksFilterBar";
import { usePackFilters } from "@/hooks/usePackFilters";

const Hermes = () => {
  const [activeTab, setActiveTab] = useState('conversas');
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [messagesRefreshTrigger, setMessagesRefreshTrigger] = useState(0);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [readConversations, setReadConversations] = useState<string[]>([]);

  const { 
    saleDetails, 
    showSaleDetails, 
    setShowSaleDetails, 
    isLoading: saleDetailsLoading, 
    error: saleDetailsError, 
    fetchSaleDetails 
  } = useSaleDetails();

  const { 
    packs, 
    setPacks, 
    isLoading: packsLoading, 
    error: packsError, 
    refreshPacks, 
    loadMorePacks, 
    hasMore 
  } = useAllPacksData(sellerId);

  const { 
    filter, 
    setFilter, 
    filterPacks, 
    isLoading: filterLoading 
  } = usePackFilters(sellerId);

  const { latestMessagesMeta, allMessages, isLoading: allMessagesLoading, error: allMessagesError } = usePacksWithMessages(packs, sellerId);
  const { messages, isLoading: messagesLoading, error: messagesError, updatePackMessages } = usePackMessages(
    selectedPackId,
    sellerId,
    messagesRefreshTrigger
  );
  
  const { clientDataMap, isLoading: clientDataLoading } = usePackClientData(
    sellerId,
    selectedPackId ? [{ pack_id: selectedPackId }] : []
  );

  useMessageNotifications(sellerId);

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
    if (sellerId) {
      const savedReadConversations = localStorage.getItem(`readConversations_${sellerId}`);
      if (savedReadConversations) {
        try {
          setReadConversations(JSON.parse(savedReadConversations));
        } catch (error) {
          console.error("Error parsing read conversations:", error);
          setReadConversations([]);
        }
      }
    }
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) return;

    const interval = setInterval(() => {
      fetch(`/api/check-update-queue?seller_id=${sellerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.updates.length > 0) {
            data.updates.forEach((update) => {
              if (update.pack_id === selectedPackId) {
                updatePackMessages(selectedPackId);
                fetch('https://projetohermes-dda7e0c8d836.herokuapp.com/notifications', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ seller_id: sellerId, pack_id: selectedPackId })
                }).catch(err => console.error(err));
              } else {
                fetch(`https://projetohermes-dda7e0c8d836.herokuapp.com/api/db/rows/all_packs`)
                  .then(res => res.json())
                  .then(data => {
                    if (Array.isArray(data.rows)) {
                      const newPack = data.rows.find((p: any) => p.pack_id === update.pack_id);
                      if (newPack) {
                        setPacks(prev => {
                          const alreadyExists = prev.some(p => p.pack_id === newPack.pack_id);
                          return alreadyExists
                            ? prev.map(p => p.pack_id === newPack.pack_id ? newPack : p)
                            : [newPack, ...prev];
                        });
                      }
                    }
                  }).catch(err => console.error(err));

                fetch('https://projetohermes-dda7e0c8d836.herokuapp.com/notifications', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ seller_id: sellerId, pack_id: update.pack_id })
                }).catch(err => console.error(err));
              }
            });
          }
        }).catch(err => console.error(err));
    }, 5000);

    return () => clearInterval(interval);
  }, [sellerId, selectedPackId]);

  const handleLoginSuccess = (sellerId: string) => {
    setIsAuthenticated(true);
    setSellerId(sellerId);
    setLoginOpen(false);
    localStorage.setItem('hermesAuth', JSON.stringify({ sellerId, timestamp: new Date().getTime() }));
    toast.success("Login realizado com sucesso!");
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    setSelectedConv(null);
    toast.info(`Carregando mensagens do pacote ${packId}`);
    
    setShowSaleDetails(false);
    
    const packMessages = allMessages[packId] || [];
    if (packMessages.length > 0) {
      const sortedMessages = [...packMessages].sort((a, b) => 
        new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
      );
      
      const latestMessage = sortedMessages[0];
      if (latestMessage && latestMessage.id) {
        const specificMessageId = `${packId}:${latestMessage.id}`;
        
        if (!readConversations.includes(specificMessageId)) {
          const updatedReadConversations = [...readConversations, specificMessageId];
          setReadConversations(updatedReadConversations);
          
          if (sellerId) {
            localStorage.setItem(`readConversations_${sellerId}`, JSON.stringify(updatedReadConversations));
          }
        }
      } else {
        if (!readConversations.includes(packId)) {
          const updatedReadConversations = [...readConversations, packId];
          setReadConversations(updatedReadConversations);
          
          if (sellerId) {
            localStorage.setItem(`readConversations_${sellerId}`, JSON.stringify(updatedReadConversations));
          }
        }
      }
    }
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

  const handleSettings = () => {
    setShowConfigPanel(true);
    if (isMobile) {
      setSelectedPackId(null);
    }
  };

  const handleCloseConfig = () => {
    setShowConfigPanel(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab !== 'configuracoes') {
      setShowConfigPanel(false);
    }
    
    if (tab === 'configuracoes') {
      setShowConfigPanel(true);
    }
  };

  const handleOpenSaleDetails = () => {
    if (sellerId && selectedPackId) {
      fetchSaleDetails(selectedPackId, sellerId);
      setShowSaleDetails(true);
    } else {
      toast.error("Não foi possível carregar os detalhes da venda");
    }
  };

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
            <NavSidebar 
              activeTab={activeTab} 
              setActiveTab={handleTabChange} 
              onLogout={handleLogout} 
              onSettings={handleSettings}
            />
          )}

          <div className={`flex-1 flex w-${isMobile ? 'full' : '[calc(100%-3.5rem)]'} ${isMobile ? 'h-[calc(100vh-56px)]' : 'h-screen'}`}>
            {showConfigPanel ? (
              <div className="w-full h-full">
                <ConfigurationsPanel sellerId={sellerId} onClose={handleCloseConfig} />
              </div>
            ) : activeTab === 'conversas' ? (
              <>
                <div className={`w-1/3 h-full flex flex-col overflow-hidden border-r ${showSaleDetails && isMobile ? 'hidden' : ''}`}>
                  <div className="p-4 border-b bg-white flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium">Clientes</h2>
                      <p className="text-sm text-gray-500">Seller ID: {sellerId}</p>
                    </div>
                    <NotificationPermission />
                  </div>
                  
                  <PacksFilterBar 
                    currentFilter={filter}
                    onFilterChange={setFilter}
                    className="border-b"
                  />
                  
                  <div className="flex-1 overflow-auto">
                    <PacksList
                      packs={filterPacks(packs)}
                      isLoading={packsLoading || filterLoading}
                      error={packsError}
                      onSelectPack={handleSelectPack}
                      selectedPackId={selectedPackId}
                      sellerId={sellerId}
                      latestMessages={Object.fromEntries(
                        Object.entries(latestMessagesMeta).map(([k, v]) => [k, v.text])
                      )}
                      allMessages={allMessages}
                      messagesLoading={allMessagesLoading}
                      messagesError={allMessagesError}
                      readConversations={readConversations}
                      loadMorePacks={loadMorePacks}
                      hasMore={hasMore}
                    />
                  </div>
                </div>

                <div className={`${showSaleDetails ? 'w-1/3' : 'w-2/3'} h-full overflow-hidden ${showSaleDetails && isMobile ? 'hidden' : ''}`}>
                  {selectedPackId ? (
                    <div className="flex flex-col h-full">
                      <MessagesList
                        messages={messages}
                        isLoading={messagesLoading}
                        error={messagesError}
                        sellerId={sellerId}
                        packId={selectedPackId}
                        onMessageSent={handleMessageSent}
                        clientData={selectedPackId ? clientDataMap[selectedPackId] : null}
                        onHeaderClick={handleOpenSaleDetails}
                      />
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

                {showSaleDetails && (
                  <div className={`${isMobile ? 'w-full' : 'w-1/3'} h-full overflow-hidden`}>
                    <SaleDetailsPanel
                      saleDetails={saleDetails}
                      isLoading={saleDetailsLoading}
                      error={saleDetailsError}
                      onClose={() => setShowSaleDetails(false)}
                      isMobile={isMobile}
                    />
                  </div>
                )}
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
            <NavSidebar 
              activeTab={activeTab} 
              setActiveTab={handleTabChange} 
              onLogout={handleLogout} 
              onSettings={handleSettings}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Hermes;
