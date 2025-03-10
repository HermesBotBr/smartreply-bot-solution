
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ProductThumbnail from './ProductThumbnail';
import SaleSwitch from './SaleSwitch';

interface ConversationsListProps {
  conversations: any[];
  selectedConv: any;
  setSelectedConv: (conv: any) => void;
  setInitialAutoScrollDone: (done: boolean) => void;
  refreshing: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConv,
  setSelectedConv,
  setInitialAutoScrollDone,
  refreshing
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterHasMessage, setFilterHasMessage] = useState(false);
  const [filterBuyerMessage, setFilterBuyerMessage] = useState(false);
  const [readConversations, setReadConversations] = useState<string[]>([]);

  // Load read conversations from localStorage
  useEffect(() => {
    const storedReadConvs = localStorage.getItem('readConversations');
    if (storedReadConvs) {
      setReadConversations(JSON.parse(storedReadConvs));
    }
  }, []);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConv) {
      const updatedReadConvs = [...readConversations];
      if (!readConversations.includes(selectedConv.orderId)) {
        updatedReadConvs.push(selectedConv.orderId);
        setReadConversations(updatedReadConvs);
        localStorage.setItem('readConversations', JSON.stringify(updatedReadConvs));
      }
    }
  }, [selectedConv, readConversations]);

  const filteredConversations = conversations.filter(conv => {
    if (
      searchText &&
      !(
        conv.buyer.toLowerCase().includes(searchText.toLowerCase()) ||
        conv.orderId.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
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

  const hasBuyerLastMessage = (conv: any) => {
    if (conv.messages.length === 0) return false;
    const lastMessage = conv.messages.reduce((prev: any, curr: any) => {
      return new Date(curr.date) > new Date(prev.date) ? curr : prev;
    }, conv.messages[0]);
    return lastMessage.sender.toLowerCase() === 'buyer' && !readConversations.includes(conv.orderId);
  };

  const sortedConversations = filteredConversations.slice().sort((a, b) => {
    const hasNewBuyerMsgA = hasBuyerLastMessage(a);
    const hasNewBuyerMsgB = hasBuyerLastMessage(b);

    // Priority 1: Unread buyer messages at top
    if (hasNewBuyerMsgA && !hasNewBuyerMsgB) return -1;
    if (!hasNewBuyerMsgA && hasNewBuyerMsgB) return 1;

    // Priority 2: If both have unread messages or both don't have unread messages, sort by date
    const getMostRecentDate = (conv: any) => {
      if (conv.messages.length === 0) return new Date(0);
      return new Date(conv.messages.reduce((prev: any, curr: any) => {
        const prevDate = new Date(prev.date).getTime();
        const currDate = new Date(curr.date).getTime();
        return currDate > prevDate ? curr : prev;
      }, conv.messages[0]).date);
    };
    return getMostRecentDate(b).getTime() - getMostRecentDate(a).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      <div className="bg-primary p-3">
        <h1 className="text-lg font-bold text-white">Monitor de Vendas</h1>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            className="bg-white text-black pl-8"
            placeholder="Pesquisar por nome ou Order_ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
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
              
              const isSelected = selectedConv && selectedConv.orderId === item.orderId;
              const hasBuyerMessage = hasBuyerLastMessage(item);
              
              return (
                <div 
                  key={item.orderId || `${item.buyer}-${Math.random()}`}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-gray-100' : 
                    hasBuyerMessage ? 'bg-blue-50 hover:bg-blue-100' : ''
                  }`}
                  onClick={() => {
                    setSelectedConv(item);
                    setInitialAutoScrollDone(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <ProductThumbnail itemId={item.itemId} />
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${hasBuyerMessage ? 'text-blue-700' : 'text-gray-900'}`}>
                          {item.buyer} {hasBuyerMessage && <span className="inline-block ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
                        </h3>
                        {item.messages.length > 0 && (
                          <p className={`text-sm truncate ${hasBuyerMessage ? 'text-blue-600' : 'text-gray-500'}`}>
                            {formattedMessage}
                          </p>
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

export default ConversationsList;
