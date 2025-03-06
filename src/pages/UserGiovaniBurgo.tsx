import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog";
import QuestionsList from "@/components/dashboard/QuestionsList";
import MetricsDisplay from "@/components/dashboard/MetricsDisplay";

const DATA_URL = 'https://7dbd2e762353.ngrok.app/all_msg.txt';
const ASKS_URL = 'https://7dbd2e762353.ngrok.app/all_asks.txt';
const GPT_URL = 'https://7dbd2e762353.ngrok.app/all_gpt.txt';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${day}/${month}/${year}`;
}

function breakTitle(title, limit = 35) {
  if (!title) return "";
  let result = "";
  for (let i = 0; i < title.length; i += limit) {
    result += title.substr(i, limit) + "\n";
  }
  return result.trim();
}

function parseMessages(text) {
  const entries = text.split("\n-------------------------------------------------\n");
  const convs = [];
  
  entries.forEach(entry => {
    if (entry.trim()) {
      const lines = entry.split('\n').filter(line => line.trim() !== '');
      let buyer = '';
      let orderId = '';
      let itemId = '';
      const messages = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Nome completo:")) {
          buyer = line.replace("Nome completo:", "").trim();
        } else if (line.startsWith("Item_id:")) {
          itemId = line.replace("Item_id:", "").trim();
        } else if (line.startsWith("Order_ID:")) {
          orderId = line.replace("Order_ID:", "").trim();
        } else if (line.startsWith("Mensagens:")) {
          continue;
        } else if (line.startsWith("Attachment:")) {
          if (messages.length > 0) {
            const attachmentLine = line.replace("Attachment:", "").trim();
            const parts = attachmentLine.split(",");
            const attachment = {
              filename: parts[0] ? parts[0].trim() : "",
              original_filename: parts[1] ? parts[1].trim() : "",
              type: parts[2] ? parts[2].trim() : "",
              size: parts[3] ? parts[3].trim() : ""
            };
            messages[messages.length - 1].message_attachments.push(attachment);
          }
        } else {
          const colonIndex = line.indexOf(":");
          if (colonIndex !== -1) {
            const sender = line.substring(0, colonIndex).trim();
            let rest = line.substring(colonIndex + 1).trim();
            let messageId = '';
            const idMatch = rest.match(/^\((\w+)\)/);
            if (idMatch) {
              messageId = idMatch[1];
              rest = rest.replace(/^\(\w+\)/, '').trim();
            }
    const match = rest.match(/\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\)$/);
let date = '';
let message = rest;
if (match) {
  date = match[1];
  message = rest.substring(0, rest.lastIndexOf(`(${date})`)).trim();
}


            messages.push({ sender, message, date, id: messageId, message_attachments: [] });
          }
        }
      }
      
      if (buyer) {
        convs.push({ buyer, orderId, itemId, messages });
      }
    }
  });
  
  return convs;
}

function ProductThumbnail({ itemId }) {
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    async function fetchThumbnail() {
      try {
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        const data = await response.json();
        setThumbnail(data.secure_thumbnail || data.thumbnail);
      } catch (error) {
        console.error("Erro ao buscar thumbnail:", error);
      }
    }
    if (itemId) {
      fetchThumbnail();
    }
  }, [itemId]);

  return (
    <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300">
      {thumbnail ? (
        <img src={thumbnail} alt="Produto" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-200"></div>
      )}
    </div>
  );
}

function SaleSwitch({ orderId }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSwitchState = async () => {
      try {
        const response = await fetch('https://7dbd2e762353.ngrok.app/switch');
        const data = await response.json();
        if (data.pack_ids && data.pack_ids.includes(orderId.toString())) {
          setIsEnabled(false);
        } else {
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Erro ao buscar estado do switch:", error);
      }
    };
    fetchSwitchState();
  }, [orderId]);

  const toggleSwitch = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    try {
      if (!newValue) {
        const response = await fetch('https://7dbd2e762353.ngrok.app/switch/off', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack_id: orderId })
        });
        const json = await response.json();
        console.log("Switch off response", json);
        toast({
          title: "Atendimento automático desativado",
          description: `Pedido #${orderId}`,
        });
      } else {
        const response = await fetch(`https://7dbd2e762353.ngrok.app/switch/on/${orderId}`, {
          method: 'DELETE'
        });
        const json = await response.json();
        console.log("Switch on response", json);
        toast({
          title: "Atendimento automático ativado",
          description: `Pedido #${orderId}`,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar switch", error);
      toast({
        title: "Erro ao atualizar atendimento",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  return (
    <Switch
      checked={isEnabled}
      onCheckedChange={toggleSwitch}
    />
  );
}

const Timeline = ({ status }) => {
  const timelineSteps = [
    { label: "Em preparação" },
    { label: "Em Trânsito" },
    { label: "Entregue" },
  ];

  let currentStep = -1;
  if (status === "ready_to_ship") {
    currentStep = 0;
  } else if (status === "shipped") {
    currentStep = 1;
  } else if (status === "delivered") {
    currentStep = 2;
  }

  return (
    <div className="flex flex-col space-y-2">
      {timelineSteps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border ${isActive ? 'bg-blue-500 border-blue-500' : 'bg-gray-300 border-gray-400'} ${isCurrent ? 'w-5 h-5' : ''}`}></div>
              {index < timelineSteps.length - 1 && (
                <div className={`w-0.5 h-8 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
            <span className={`ml-3 ${isCurrent ? 'font-bold' : ''}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

function formatDateTime(dt) {
  if (!dt) return "(não informado)";
  const parts = dt.split("T");
  if (parts.length < 2) return dt;
  const date = parts[0];
  const timeZoneSplit = parts[1].split(".");
  const time = timeZoneSplit[0];
  const zone = dt.substring(dt.indexOf('-'), dt.length);
  return `${date} ${time} (${zone})`;
}

function formatCurrency(value) {
  if (value == null) return "(não informado)";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const UserGiovaniBurgo = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('conversas');
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterHasMessage, setFilterHasMessage] = useState(false);
  const [filterBuyerMessage, setFilterBuyerMessage] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [mlToken, setMlToken] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [gptIds, setGptIds] = useState([]);
  const [detailedInfo, setDetailedInfo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list', 'detail', 'saleDetail'
  
  const chatEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('https://7dbd2e762353.ngrok.app/mercadoLivreApiKey.txt');
        const tokenText = await response.text();
        setMlToken(tokenText.trim());
      } catch (error) {
        console.error("Erro ao buscar token:", error);
      }
    };
    fetchToken();
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
      if (activeView === 'detail' && selectedConv) {
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
    if (activeView === 'detail') {
      intervalId = setInterval(loadData, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeView, selectedConv]);

  useEffect(() => {
    if (activeView === 'saleDetail') {
      fetchSaleDetails();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'detail' && chatEndRef.current && !initialAutoScrollDone) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setInitialAutoScrollDone(true);
    }
  }, [activeView, selectedConv, initialAutoScrollDone]);

  const fetchSaleDetails = async () => {
    try {
      const tokenResponse = await fetch('https://7dbd2e762353.ngrok.app/mercadoLivreApiKey.txt');
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
      const tokenResponse = await fetch('https://7dbd2e762353.ngrok.app/mercadoLivreApiKey.txt');
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

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      sender: 'seller',
      message: messageText,
      date: new Date().toISOString(),
      id: 'temp-' + Date.now(),
      message_attachments: []
    };

    setSelectedConv(prevConv => ({
      ...prevConv,
      messages: [...prevConv.messages, newMessage]
    }));

    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    try {
      if (!mlToken) {
        console.error("Token da API não disponível");
        return;
      }

      const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${mlToken}`);
      const orderData = await orderResponse.json();
      const buyer_id = orderData?.buyer?.id;

      if (!buyer_id) {
        console.error("buyer_id não encontrado na resposta do endpoint de orders");
        return;
      }

      const response = await fetch('https://7dbd2e762353.ngrok.app/sendmsg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pack_id: selectedConv.orderId,
          buyer_id: buyer_id,
          message: messageText
        })
      });

      const data = await response.json();
      console.log("Mensagem enviada:", data);
      setMessageText('');
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchText && !conv.buyer.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (filterHasMessage && conv.messages.length === 0) {
      return false;
    }
    if (filterBuyerMessage && !conv.messages.some(msg => msg.sender.toLowerCase() === 'buyer')) {
      return false;
    }
    return true;
  });

  const sortedConversations = filteredConversations.slice().sort((a, b) => {
    const getMostRecentDate = (conv) => {
      if (conv.messages.length === 0) return new Date(0);
      return new Date(conv.messages.reduce((prev, curr) => {
        const prevDate = new Date(prev.date).getTime();
        const currDate = new Date(curr.date).getTime();
        return currDate > prevDate ? curr : prev;
      }, conv.messages[0]).date);
    };
    return getMostRecentDate(b).getTime() - getMostRecentDate(a).getTime();
  });

  const renderListView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-primary text-white p-4">
          <h1 className="text-xl font-bold mb-4">Monitor de Vendas</h1>
          <div className="flex items-center gap-2">
            <Input
              className="flex-1 bg-white text-black"
              placeholder="Pesquisar por nome completo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button 
              variant="secondary"
              onClick={() => setFilterModalVisible(true)}
            >
              Filtros
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {refreshing ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="divide-y">
              {sortedConversations.map((item) => {
                let formattedMessage = "";
                if (item.messages && item.messages.length > 0) {
                  const mostRecentMessage = item.messages.reduce(
                    (prev, curr) => (new Date(curr.date) > new Date(prev.date) ? curr : prev),
                    item.messages[0]
                  );
                  formattedMessage = mostRecentMessage.message.replace(/\\n/g, "\n");
                } else {
                  formattedMessage = "Sem mensagem";
                }
                
                return (
                  <div 
                    key={item.orderId || `${item.buyer}-${Math.random()}`}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedConv(item);
                      setActiveView('detail');
                      setInitialAutoScrollDone(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <ProductThumbnail itemId={item.itemId} />
                        <div className="ml-3 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{item.buyer}</h3>
                          {item.messages.length > 0 && (
                            <p className="text-sm text-gray-500 truncate">{formattedMessage}</p>
                          )}
                        </div>
                      </div>
                      <SaleSwitch orderId={item.orderId} />
                    </div>
                  </div>
                );
              })}
              
              {sortedConversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma conversa encontrada
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailScreen = () => {
    const sortedMessages = selectedConv.messages.slice().sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return (
      <div className="flex flex-col h-full">
        <div className="bg-primary text-white p-4 flex items-center">
          <Button
            variant="ghost" 
            className="text-white mr-2"
            onClick={() => setActiveView('list')}
          >
            ←
          </Button>
          <div>
            <button
              className="text-lg font-bold text-white hover:underline"
              onClick={() => setActiveView('saleDetail')}
            >
              {selectedConv.buyer}
            </button>
            <p className="text-sm opacity-80">Order_ID: {selectedConv.orderId}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {sortedMessages.map((msg, index) => {
            const currentMessageDate = formatDate(msg.date);
            const previousMessageDate = index > 0 ? formatDate(sortedMessages[index - 1].date) : null;
            const now = new Date();
            
            let messageClass = "";
            if (msg.sender.toLowerCase() === 'seller') {
              const timeDiff = now.getTime() - new Date(msg.date).getTime();
              if (timeDiff < 10000) {
                messageClass = "bg-gray-300 self-end";
              } else if (msg.id && gptIds.includes(msg.id)) {
                messageClass = "bg-blue-200 self-end";
              } else {
                messageClass = "bg-green-100 self-end";
              }
            } else {
              messageClass = "bg-white self-start";
            }
            
            return (
              <div key={index}>
                {(index === 0 || currentMessageDate !== previousMessageDate) && (
                  <div className="flex justify-center my-3">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                      {currentMessageDate}
                    </div>
                  </div>
                )}
                
                <div className={`rounded-lg p-3 max-w-[70%] mb-2 shadow-sm ${messageClass}`}>
                  {msg.message_attachments && msg.message_attachments.length > 0 && (
                    <div 
                      className="mb-2 cursor-pointer" 
                      onClick={() => setFullScreenImage(`https://api.mercadolibre.com/messages/attachments/${msg.message_attachments[0].filename}?site_id=MLB`)}
                    >
                      <img
                        src={`https://api.mercadolibre.com/messages/attachments/${msg.message_attachments[0].filename}?site_id=MLB`}
                        alt="Anexo"
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                  )}
                  
                  {msg.message && (
                    <p className="whitespace-pre-wrap">
                      {msg.message.replace(/\\n/g, "\n")}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {formatTime(msg.date)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t flex gap-2">
          <Input
            className="flex-1"
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}>Enviar</Button>
        </div>
        
        {fullScreenImage && (
          <Dialog open={!!fullScreenImage} onOpenChange={() => setFullScreenImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Anexo</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={fullScreenImage}
                  alt="Anexo em tamanho completo"
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  };

  const renderSaleDetailView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-primary text-white p-4 flex items-center">
          <Button
            variant="ghost" 
            className="text-white mr-2"
            onClick={() => setActiveView('detail')}
          >
            ←
          </Button>
          <h1 className="text-lg font-bold">Detalhes da venda</h1>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {!orderDetails ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="relative">
                <img 
                  src="https://http2.mlstatic.com/static/org-img/homesnw/mercado-livre.png?v=2"
                  alt="Mercado Livre"
                  className="absolute top-4 right-4 w-24 h-auto"
                />
                
                <CardHeader>
                  <CardTitle>Detalhes da venda</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-800 mb-3">Venda: #{orderDetails.id}</p>
                  <div className="flex items-center">
                    <ProductThumbnail itemId={orderDetails.order_items && orderDetails.order_items[0]?.item?.id} />
                    <p className="ml-3 font-medium">
                      {orderDetails.order_items && orderDetails.order_items[0]?.item?.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Rastreamento de envio</CardTitle>
                </CardHeader>
                <CardContent>
                  {shippingDetails ? (
                    <Timeline status={shippingDetails.status} />
                  ) : (
                    <p>Sem informações de envio.</p>
                  )}
                </CardContent>
              </Card>
              
              <Button
                className="w-full"
                onClick={() => {
                  if (!detailedInfo) {
                    fetchDetailedInfo();
                  } else {
                    setExpandedInfo(!expandedInfo);
                  }
                }}
              >
                {!detailedInfo ? "Carregar informações detalhadas" : 
                  expandedInfo ? "Ocultar informações detalhadas" : "Mostrar informações detalhadas"}
              </Button>
              
              {expandedInfo && detailedInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informações detalhadas</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-auto">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">Resumo do Pedido</h3>
                        <p>ID do Pedido: {detailedInfo.id}</p>
                        <p>Data de Criação: {formatDateTime(detailedInfo.date_created)}</p>
                        <p>Última Atualização: {formatDateTime(detailedInfo.last_updated)}</p>
                        <p>Data de Fechamento: {formatDateTime(detailedInfo.date_closed)}</p>
                        <p>Status: {detailedInfo.status}</p>
                        <p>Detalhe do Status: {detailedInfo.status_detail || "(não informado)"}</p>
                        <p>Tags: {detailedInfo.tags ? detailedInfo.tags.join(", ") : "(não informado)"}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-2">Detalhes Gerais</h3>
                        <p>Modo de Compra: {detailedInfo.buying_mode}</p>
                        <p>Montante Total: {formatCurrency(detailedInfo.total_amount)}</p>
                        <p>Montante Pago: {formatCurrency(detailedInfo.paid_amount)}</p>
                        <p>Moeda: {detailedInfo.currency_id}</p>
                        <p>Fulfilled: {detailedInfo.fulfilled ? "Sim" : "Não"}</p>
                        <p>ID do Envio: {detailedInfo.shipping ? detailedInfo.shipping.id : "(não informado)"}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-2">Informações do Vendedor e Comprador</h3>
                        <p>Vendedor ID: {detailedInfo.seller ? detailedInfo.seller.id : "(não informado)"}</p>
                        <p>Comprador ID: {detailedInfo.buyer ? detailedInfo.buyer.id : "(não informado)"}</p>
                        <p>Nickname: {detailedInfo.buyer ? detailedInfo.buyer.nickname : "(não informado)"}</p>
                        <p>Nome: {detailedInfo.buyer ? detailedInfo.buyer.first_name : "(não informado)"}</p>
                        <p>Sobrenome: {detailedInfo.buyer ? detailedInfo.buyer.last_name : "(não informado)"}</p>
                      </div>
                      
                      {detailedInfo.order_items && detailedInfo.order_items.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-2">Itens do Pedido</h3>
                          {detailedInfo.order_items.map((item, idx) => (
                            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded">
                              <p className="font-medium">Item {idx + 1}</p>
                              <p>ID do Item: {item.item.id}</p>
                              <p>Título: {item.item.title}</p>
                              <p>Categoria: {item.item.category_id}</p>
                              <p>Condição: {item.item.condition}</p>
                              <p>Quantidade: {item.quantity}</p>
                              <p>Preço Unitário: {formatCurrency(item.unit_price)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {detailedInfo.payments && detailedInfo.payments.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-2">Pagamento</h3>
                          {detailedInfo.payments.map((pay, idx) => (
                            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded">
                              <p className="font-medium">Pagamento {idx + 1}</p>
                              <p>ID do Pagamento: {pay.id}</p>
                              <p>Método: {pay.payment_method_id}</p>
                              <p>Tipo: {pay.payment_type}</p>
                              <p>Status: {pay.status} ({pay.status_detail || "(não informado)"})</p>
                              <p>Valor: {formatCurrency(pay.transaction_amount)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-hidden">
        <Tabs 
          defaultValue="conversas" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="conversas">Conversas</TabsTrigger>
            <TabsTrigger value="perguntas">Perguntas</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="conversas" className="h-full">
              {activeView === 'list' && renderListView()}
              {activeView === 'detail' && renderDetailScreen()}
              {activeView === 'saleDetail' && renderSaleDetailView()}
            </TabsContent>
            
            <TabsContent value="perguntas" className="h-full">
              <QuestionsList mlToken={mlToken} />
            </TabsContent>
            
            <TabsContent value="metricas" className="h-full">
              <MetricsDisplay />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <Dialog open={filterModalVisible} onOpenChange={setFilterModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar Conversas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-has-message"
                checked={filterHasMessage}
                onCheckedChange={setFilterHasMessage}
              />
              <label htmlFor="filter-has-message">Com Mensagem</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-buyer-message"
                checked={filterBuyerMessage}
                onCheckedChange={setFilterBuyerMessage}
              />
              <label htmlFor="filter-buyer-message">Mensagem Comprador</label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setFilterModalVisible(false)}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserGiovaniBurgo;
