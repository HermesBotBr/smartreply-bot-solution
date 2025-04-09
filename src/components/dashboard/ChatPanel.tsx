
import React, { useRef, useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, ArrowLeft, Paperclip, Loader2, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductThumbnail from './ProductThumbnail';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import { getNgrokUrl } from '@/config/api';
import { uploadFileToMercadoLivre } from '@/utils/fileUpload';

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
  onBack?: () => void;
  isMobile: boolean;
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
  setInitialAutoScrollDone,
  onBack,
  isMobile
}) => {
  const [messageText, setMessageText] = useState('');
  const [tempMessages, setTempMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (chatEndRef.current && !initialAutoScrollDone) {
      // Use a small timeout to ensure the header is fully rendered and fixed
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setInitialAutoScrollDone(true);
      }, 100);
    }
  }, [selectedConv, initialAutoScrollDone, setInitialAutoScrollDone]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedConv) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      // Upload file to Mercado Livre
      setUploadingFile(true);
      setAttachmentId(null);
      
      try {
        const id = await uploadFileToMercadoLivre(file, selectedConv.sellerId || '');
        setAttachmentId(id);
        toast({
          title: "Arquivo enviado",
          description: "O arquivo foi enviado com sucesso",
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Erro ao enviar arquivo",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
        setSelectedFile(null);
        setFilePreview(null);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAttachmentId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!messageText.trim() && !attachmentId) || !selectedConv) return;
    
    setSending(true);
    
    const newMessage = {
      sender: 'seller',
      message: messageText,
      date: new Date().toISOString(),
      id: 'temp-' + Date.now(),
      message_attachments: [],
      conversationId: selectedConv.orderId
    };

    setTempMessages(prev => [...prev, newMessage]);
    setMessageText('');

    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    try {
      if (!mlToken) {
        console.error("Token da API não disponível");
        setSending(false);
        return;
      }

      const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${mlToken}`);
      const orderData = await orderResponse.json();
      const buyer_id = orderData?.buyer?.id;

      if (!buyer_id) {
        console.error("buyer_id não encontrado na resposta do endpoint de orders");
        setSending(false);
        return;
      }

      // Prepare the request payload
      const messagePayload = {
        pack_id: selectedConv.orderId,
        buyer_id: buyer_id,
        message: messageText
      };
      
      // Add attachment ID if available
      if (attachmentId) {
        Object.assign(messagePayload, { attachments: attachmentId });
      }

      const response = await fetch(getNgrokUrl('sendmsg'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });

      const data = await response.json();
      console.log("Mensagem enviada:", data);
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
      
      // Clear attachment state after sending
      setSelectedFile(null);
      setFilePreview(null);
      setAttachmentId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!selectedConv) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-gray-500">Selecione uma conversa para visualizar as mensagens</p>
      </div>
    );
  }

  const filteredTempMessages = tempMessages.filter(tempMsg => {
    if (tempMsg.conversationId !== selectedConv.orderId) {
      return false;
    }
    
    const isConfirmed = selectedConv.messages.some(
      (msg: any) => 
        msg.sender === 'seller' && 
        msg.message === tempMsg.message && 
        Math.abs(new Date(msg.date).getTime() - new Date(tempMsg.date).getTime()) < 60000
    );
    
    if (isConfirmed) {
      return false;
    }
    
    const tempMessageTime = new Date(tempMsg.date).getTime();
    const hasMatchingOfficialMessage = selectedConv.messages.some(
      (msg: any) =>
        msg.sender.toLowerCase() === 'seller' &&
        msg.message === tempMsg.message &&
        !(msg.id && msg.id.startsWith('temp-')) &&
        !(msg.id && gptIds.includes(msg.id)) &&
        new Date(msg.date).getTime() >= tempMessageTime
    );

    return !hasMatchingOfficialMessage;
  });

  const sortedMessages = [...selectedConv.messages, ...filteredTempMessages].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return (
    <div className="flex flex-col h-full">
      {/* Header - Always fixed at top on mobile */}
      <div 
        className={`bg-primary text-white p-3 flex items-center ${isMobile ? 'sticky top-0 z-10' : ''}`}
      >
        {isMobile && onBack && (
          <button 
            onClick={onBack}
            className="mr-2 text-white"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div 
          className="flex items-center flex-1 cursor-pointer"
          onClick={() => setShowSaleDetails(!showSaleDetails)}
        >
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
      
      {/* Messages container - This will scroll independently */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {sortedMessages.map((msg, index) => {
          const currentMessageDate = formatDate(msg.date);
          const previousMessageDate = index > 0 ? formatDate(sortedMessages[index - 1].date) : null;
          const now = new Date();
          
          let messageClass = "";
          if (msg.sender.toLowerCase() === 'seller') {
            const isTemp = msg.id && msg.id.startsWith('temp-');
            const timeDiff = now.getTime() - new Date(msg.date).getTime();
            
            if (isTemp) {
              messageClass = "bg-gray-300 self-end";
            } else if (timeDiff < 10000) {
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
      
      {/* Footer - Fixed at bottom on mobile */}
      <div className={`bg-white border-t ${isMobile ? 'sticky bottom-0 z-10' : ''}`}>
        {selectedFile && (
          <div className="px-3 py-2 bg-blue-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Paperclip size={16} className="mr-2 text-blue-500" />
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <button 
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-500"
                aria-label="Remover arquivo"
              >
                <X size={16} />
              </button>
            </div>
            {filePreview && (
              <div className="mt-2 mb-1">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="h-20 max-w-full object-contain rounded" 
                />
              </div>
            )}
            {attachmentId && (
              <div className="mt-1">
                <p className="text-xs text-green-600">Arquivo pronto para envio (ID: {attachmentId.substring(0, 12)}...)</p>
              </div>
            )}
          </div>
        )}
        
        <div className="p-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFile}
            className="flex-shrink-0"
            title="Anexar arquivo"
          >
            {uploadingFile ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Paperclip size={18} />
            )}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
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
            disabled={sending || uploadingFile}
          />
          
          <Button 
            onClick={sendMessage} 
            disabled={(!messageText.trim() && !attachmentId) || sending || uploadingFile}
          >
            {sending ? (
              <Loader2 size={18} className="mr-1 animate-spin" />
            ) : (
              <Send size={18} className="mr-1" />
            )}
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
