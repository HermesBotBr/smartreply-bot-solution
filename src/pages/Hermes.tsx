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
import PacksList from "@/components/dashboard/PacksList";
import MessagesList from "@/components/dashboard/MessagesList";
import NotificationPermission from "@/components/NotificationPermission";
import ConfigurationsPanel from "@/components/dashboard/ConfigurationsPanel";

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
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const { packs, setPacks, isLoading: packsLoading, error: packsError, refreshPacks } = useAllPacksData(sellerId);
  const { latestMessagesMeta, allMessages, isLoading: allMessagesLoading, error: allMessagesError } = usePacksWithMessages(packs, sellerId);
  const { messages, isLoading: messagesLoading, error: messagesError, updatePackMessages } = usePackMessages(
    selectedPackId,
    sellerId,
    messagesRefreshTrigger
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
                <div className="w-1/3 h-full overflow-auto border-r">
                  <div className="p-4 border-b bg-white flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium">Clientes</h2>
                      <p className="text-sm text-gray-500">Seller ID: {sellerId}</p>
                    </div>
                    <NotificationPermission />
                  </div>
                  <PacksList
                    packs={[...packs].sort((a, b) => {
                      const dateA = latestMessagesMeta[a.pack_id]?.createdAt
                        ? new Date(latestMessagesMeta[a.pack_id].createdAt).getTime()
                        : 0;

                      const dateB = latestMessagesMeta[b.pack_id]?.createdAt
                        ? new Date(latestMessagesMeta[b.pack_id].createdAt).getTime()
                        : 0;

                      return dateB - dateA;
                    })}
                    isLoading={packsLoading}
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
