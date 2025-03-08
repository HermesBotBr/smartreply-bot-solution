
import React, { useState } from 'react';
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
              
              return (
                <div 
                  key={item.orderId || `${item.buyer}-${Math.random()}`}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-gray-100' : ''}`}
                  onClick={() => {
                    setSelectedConv(item);
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
