
import React, { useRef, useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductThumbnail from './ProductThumbnail';
import { formatDate, formatTime } from '@/utils/dateFormatters';

interface ChatPanelProps {
  selectedConv: any;
  showSaleDetails: boolean;
  setShowSaleDetails: (show: boolean) => void;
  gptIds: string[];
  mlToken: string | null;
  setFullScreenImage: (url: string | null) => void;
  isAtBottom: boolean;
  initialAutoScrollDone: boolean;
  setInitialAutoScrollDone: (done: boolean) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  selectedConv,
  showSaleDetails,
  setShowSaleDetails,
  gptIds,
  mlToken,
  setFullScreenImage,
  isAtBottom,
  initialAutoScrollDone,
  setInitialAutoScrollDone
}) => {
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (chatEndRef.current && !initialAutoScrollDone) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setInitialAutoScrollDone(true);
    }
  }, [selectedConv, initialAutoScrollDone, setInitialAutoScrollDone]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConv) return;
    
    const newMessage = {
      sender: 'seller',
      message: messageText,
      date: new Date().toISOString(),
      id: 'temp-' + Date.now(),
      message_attachments: []
    };

    // We can't modify selectedConv directly in a React component like this
    // This update should be handled by the parent component
    const updatedMessages = [...selectedConv.messages, newMessage];
    const updatedConv = {
      ...selectedConv,
      messages: updatedMessages
    };
    
    // The parent component should handle this
    // setSelectedConv(updatedConv);

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

      const response = await fetch('https://9cf7e1a3f021.ngrok.app/sendmsg', {
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

  if (!selectedConv) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-gray-500">Selecione uma conversa para visualizar as mensagens</p>
      </div>
    );
  }

  const sortedMessages = selectedConv.messages.slice().sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return (
    <div className="flex flex-col h-full">
      <div 
        className="bg-primary text-white p-3 flex items-center cursor-pointer"
        onClick={() => setShowSaleDetails(!showSaleDetails)}
      >
        <div className="flex items-center">
          <ProductThumbnail itemId={selectedConv.itemId} />
          <div className="ml-3">
            <h2 className="text-lg font-bold">{selectedConv.buyer}</h2>
            <p className="text-xs opacity-80">Order_ID: {selectedConv.orderId}</p>
          </div>
        </div>
        <div className="ml-auto">
          <Info size={20} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
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
              
              <div className={`flex ${msg.sender.toLowerCase() === 'seller' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-[70%] mb-2 shadow-sm ${messageClass}`}>
                  {msg.message_attachments && msg.message_attachments.length > 0 && (
                    <div>
                      {(() => {
                        const attachmentFilename = msg.message_attachments[0].filename.trim();
                        const attachmentUrl = `https://api.mercadolibre.com/messages/attachments/${attachmentFilename}?site_id=MLB${mlToken ? `&access_token=${mlToken}` : ''}`;
                        return (
                          <div 
                            className="mb-2 cursor-pointer" 
                            onClick={() => setFullScreenImage(attachmentUrl)}
                          >
                            <img
                              src={attachmentUrl}
                              alt="Anexo"
                              className="w-24 h-24 object-cover rounded"
                            />
                          </div>
                        );
                      })()}
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
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-3 bg-white border-t flex gap-2">
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
    </div>
  );
};

export default ChatPanel;
