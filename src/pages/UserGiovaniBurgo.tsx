import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MessageSquare, HelpCircle, BarChart, ArrowLeft, Tag } from "lucide-react";

import ConversationsList from "@/components/dashboard/ConversationsList";
import ChatPanel from "@/components/dashboard/ChatPanel";
import SaleDetailsPanel from "@/components/dashboard/SaleDetailsPanel";
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";
import EtiquetasList from "@/components/dashboard/EtiquetasList";
import { parseMessages } from "@/utils/messageParser";

const DATA_URL = 'https://b4c027be31fe.ngrok.app/all_msg.txt';
const ASKS_URL = 'https://b4c027be31fe.ngrok.app/all_asks.txt';
const GPT_URL = 'https://b4c027be31fe.ngrok.app/all_gpt.txt';
const READ_CONVERSATIONS_URL = 'https://b4c027be31fe.ngrok.app/read_conversations.txt';

const UserGiovaniBurgo = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('conversas');
  const [orderDetails, setOrderDetails] = useState(null);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [mlToken, setMlToken] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [gptIds, setGptIds] = useState([]);
  const [detailedInfo, setDetailedInfo] = useState(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [readConversations, setReadConversations] = useState<string[]>([]);
  const [serverSyncError, setServerSyncError] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(0);

  const { toast } = useToast();

  const fetchReadConversations = async () => {
    try {
      console.log("Fetching read conversations from server");
      const response = await fetch(READ_CONVERSATIONS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch read conversations: ${response.status}`);
      }
      const text = await response.text();
      console.log("Read conversations response:", text);
      if (text && text.trim()) {
        const readConvs = text.split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== "undefined" && line !== "null");
        console.log("Parsed read conversations:", readConvs);
        setReadConversations(readConvs);
        // Update localStorage as fallback
        localStorage.setItem('readConversations', JSON.stringify(readConvs));
        setServerSyncError(false);
      } else {
        console.log("No read conversations found on server");
        // Try to get from localStorage if server returns empty
        const storedReadConvs = localStorage.getItem('readConversations');
        if (storedReadConvs) {
          const parsedConvs = JSON.parse(storedReadConvs);
          console.log("Using localStorage read conversations:", parsedConvs);
          setReadConversations(parsedConvs);
        } else {
          setReadConversations([]);
        }
      }
    } catch (error) {
      console.error("Error fetching read conversations:", error);
      setServerSyncError(true);
      // Fallback to localStorage
      const storedReadConvs = localStorage.getItem('readConversations');
      if (storedReadConvs) {
        try {
          const parsedConvs = JSON.parse(storedReadConvs);
          console.log("Using localStorage fallback for read conversations:", parsedConvs);
          setReadConversations(parsedConvs);
        } catch (e) {
          console.error("Error parsing localStorage readConversations:", e);
          setReadConversations([]);
        }
      } else {
        setReadConversations([]);
      }
    }
  };

  const markAsRead = async (orderId: string | string[]) => {
    let orderIds: string[] = [];
    
    if (Array.isArray(orderId)) {
      orderIds = orderId.filter(id => id && !readConversations.includes(id));
    } else if (orderId && !readConversations.includes(orderId)) {
      orderIds = [orderId];
    }
    
    if (orderIds.length === 0) return;
    
    console.log(`Marking conversation(s) as read: ${orderIds.join(', ')}`);
    
    // Update local state immediately with all IDs
    const updatedReadConvs = [...readConversations, ...orderIds];
    setReadConversations(updatedReadConvs);
    
    // Save to localStorage
    localStorage.setItem('readConversations', JSON.stringify(updatedReadConvs));
    
    const now = Date.now();
    if (serverSyncError && now - lastSyncAttempt < 60000) { // 1 minute cooldown
      console.log("Skipping server sync due to recent errors");
      return;
    }
    
    setLastSyncAttempt(now);
    
    try {
      // Modified to send all order IDs in a single request
      const response = await fetch('https://b4c027be31fe.ngrok.app/mark_read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark conversations as read: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Server response for mark as read:", result);
      setServerSyncError(false);
    } catch (error) {
      console.error("Error marking conversations as read:", error);
      setServerSyncError(true);
      
      if (!serverSyncError) { // Only show error once
        toast({
          title: "Erro ao marcar conversas como lidas",
          description: "Os dados foram salvos localmente, mas não puderam ser sincronizados com o servidor",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('https://b4c027be31fe.ngrok.app/mercadoLivreApiKey.txt');
        const tokenText = await response.text();
        setMlToken(tokenText.trim());
      } catch (error) {
        console.error("Erro ao buscar token:", error);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    fetchReadConversations();
    
    const readInterval = setInterval(fetchReadConversations, 30000);
    return () => clearInterval(readInterval);
  }, []);

  useEffect(() => {
    const fetchGptIds = async () => {
      try {
        const response = await fetch(GPT_URL);
        const text = await response.text();
        const ids = text.split('\n').map(line => line.trim()).filter(line => line);
        setGptIds(ids);
      } catch (error) {
        console.error("Erro ao buscar GPT IDs:", error);
      }
    };
    fetchGptIds();
    const interval = setInterval(fetchGptIds, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(DATA_URL);
      const textData = await response.text();
      const convs = parseMessages(textData);
      setConversations(convs);
      
      if (selectedConv) {
        const updatedConv = convs.find(c => c.orderId === selectedConv.orderId);
        if (updatedConv) {
          setSelectedConv(updatedConv);
        }
      }
      
      setRefreshing(false);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let intervalId;
    if (showSaleDetails && selectedConv) {
      intervalId = setInterval(loadData, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showSaleDetails, selectedConv]);

  useEffect(() => {
    if (showSaleDetails && selectedConv) {
      fetchSaleDetails();
    }
  }, [showSaleDetails, selectedConv]);

  const fetchSaleDetails = async () => {
    try {
      const tokenResponse = await fetch('https://b4c027be31fe.ngrok.app/mercadoLivreApiKey.txt');
      const token = await tokenResponse.text();
      const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${token.trim()}`);
      const orderData = await orderResponse.json();
      setOrderDetails(orderData);
      if(orderData.shipping && orderData.shipping.id) {
        const shippingResponse = await fetch(`https://api.mercadolibre.com/shipments/${orderData.shipping.id}?access_token=${token.trim()}`);
        const shippingData = await shippingResponse.json();
        setShippingDetails(shippingData);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da venda:", error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível obter informações desta venda",
        variant: "destructive",
      });
    }
  };

  const fetchDetailedInfo = async () => {
    try {
      const tokenResponse = await fetch('https://b4c027be31fe.ngrok.app/mercadoLivreApiKey.txt');
      const token = await tokenResponse.text();
      
      let orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${token.trim()}`);
      let detailedData = await orderResponse.json();
      
      if (detailedData.error === "order_not_found") {
        const packResponse = await fetch(`https://api.mercadolibre.com/packs/${selectedConv.orderId}?access_token=${token.trim()}`);
        const packData = await packResponse.json();
        if (packData.orders && packData.orders.length > 0) {
          const correctOrderId = packData.orders[0].id;
          orderResponse = await fetch(`https://api.mercadolibre.com/orders/${correctOrderId}?access_token=${token.trim()}`);
          detailedData = await orderResponse.json();
        }
      }
      
      setDetailedInfo(detailedData);
      setExpandedInfo(true);
    } catch (error) {
      console.error("Erro ao carregar informações detalhadas:", error);
      toast({
        title: "Erro ao carregar informações",
        description: "Não foi possível obter informações detalhadas",
        variant: "destructive",
      });
    }
  };

  const handleCloseSaleDetails = () => {
    setShowSaleDetails(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-14 bg-gray-100 border-r flex flex-col items-center py-4">
        <div 
          className={`w-10 h-10 flex items-center justify-center rounded-full mb-4 cursor-pointer ${activeTab === 'conversas' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('conversas')}
        >
          <MessageSquare size={20} />
        </div>
        <div 
          className={`w-10 h-10 flex items-center justify-center rounded-full mb-4 cursor-pointer ${activeTab === 'perguntas' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('perguntas')}
        >
          <HelpCircle size={20} />
        </div>
        <div 
          className={`w-10 h-10 flex items-center justify-center rounded-full mb-4 cursor-pointer ${activeTab === 'metricas' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('metricas')}
        >
          <BarChart size={20} />
        </div>
        <div 
          className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer ${activeTab === 'etiquetas' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('etiquetas')}
        >
          <Tag size={20} />
        </div>
      </div>

      <div className="flex-1 flex w-[calc(100%-3.5rem)]">
        {activeTab === 'conversas' ? (
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
                isAtBottom={isAtBottom}
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
                  fetchDetailedInfo={fetchDetailedInfo}
                  onClose={handleCloseSaleDetails}
                  markAsRead={markAsRead}
                />
              </div>
            )}
          </>
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

      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative">
            <img 
              src={fullScreenImage} 
              alt="Imagem" 
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-1 text-black"
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImage(null);
              }}
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGiovaniBurgo;

