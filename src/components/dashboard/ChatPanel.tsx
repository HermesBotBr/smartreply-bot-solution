import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, Info, X, FileText, Send, Image as ImageIcon } from 'lucide-react';
import { MlTokenType } from '@/hooks/useMlToken';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import ProductThumbnail from './ProductThumbnail';

interface ChatMessage {
  id: string;
  from: { user_id: number };
  to: { user_id: number };
  text: string;
  message_date: {
    received: string;
    available: string;
    created: string;
    read: string;
  };
  message_attachments: any[] | null;
}

interface ChatPanelProps {
  selectedConv: any;
  showSaleDetails: boolean;
  setShowSaleDetails: (show: boolean) => void;
  gptIds: string[];
  mlToken: MlTokenType;
  setFullScreenImage: (url: string | null) => void;
  isAtBottom: boolean;
  initialAutoScrollDone: boolean;
  setInitialAutoScrollDone: (done: boolean) => void;
  onBack?: () => void;
  isMobile?: boolean;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(initialAutoScrollDone);

  useEffect(() => {
    if (initialAutoScrollDone) {
      setIsInitialScrollDone(true);
    }
  }, [initialAutoScrollDone]);

  useEffect(() => {
    if (selectedConv) {
      setMessages(selectedConv.messages);
    }
  }, [selectedConv]);

  useEffect(() => {
    if (isAtBottom && !isMobile) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, isMobile]);

  useEffect(() => {
    if (chatContainerRef.current && isAutoScrolling && !isMobile) {
      scrollToBottom();
    }
  }, [isAutoScrolling, isMobile]);

  useEffect(() => {
    if (chatContainerRef.current && !isInitialScrollDone && !isMobile) {
      scrollToBottom();
      setIsInitialScrollDone(true);
      setInitialAutoScrollDone(true);
    }
  }, [isInitialScrollDone, isMobile, setInitialAutoScrollDone]);

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setIsAutoScrolling(isAtBottom);
  };

  const handleImageClick = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const handleSend = async () => {
    if (!selectedConv || !selectedConv.pack_id) {
      toast({
        title: "Erro",
        description: "Nenhum pacote selecionado para enviar a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (!messageText.trim()) {
      toast({
        title: "Alerta",
        description: "Por favor, insira uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pack_id: selectedConv.pack_id,
          message: messageText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageText('');
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao enviar a mensagem.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isGptMessage = gptIds.includes(message.id);
    const isFromMe = message.from.user_id === selectedConv.seller_id;
    const messageDate = message.message_date.created ? new Date(message.message_date.created) : new Date();
    const timeAgo = formatDistanceToNow(messageDate, {
      addSuffix: true,
      locale: ptBR,
    });

    return (
      <div
        key={message.id}
        className={`mb-2 flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`rounded-xl px-4 py-2 max-w-[80%] ${isFromMe
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
        >
          <p className="text-sm break-words">{message.text}</p>
          {message.message_attachments && message.message_attachments.length > 0 && (
            <div className="mt-2">
              {message.message_attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {attachment.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <button onClick={() => handleImageClick(`https://projetohermes-dda7e0c8d836.herokuapp.com/download?file=${attachment.filename}`)} className="inline-block">
                      <img
                        src={`https://projetohermes-dda7e0c8d836.herokuapp.com/download?file=${attachment.filename}`}
                        alt={attachment.original_filename}
                        className="max-w-40 max-h-40 rounded-md cursor-pointer"
                      />
                    </button>
                  ) : (
                    <a
                      href={`https://projetohermes-dda7e0c8d836.herokuapp.com/download?file=${attachment.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center"
                    >
                      <FileText className="mr-1 w-4 h-4" />
                      {attachment.original_filename}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {isGptMessage && (
            <div className="text-xs mt-1 italic">
              <span className="font-semibold">Sugestão do Hermes</span>
            </div>
          )}
          <div className="text-xs mt-1 text-right opacity-80">{timeAgo}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center">
        {isMobile && onBack && (
          <button onClick={onBack} className="mr-4">
            <ChevronLeft size={20} />
          </button>
        )}
        <ProductThumbnail itemId={selectedConv?.item_id} />
        <div className="ml-4 flex-grow">
          <h2 className="text-lg font-semibold">{selectedConv?.client_name}</h2>
          <p className="text-sm text-gray-500">{selectedConv?.pack_id}</p>
        </div>
        <div>
          <button onClick={() => setShowSaleDetails(true)}>
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.map(message => renderMessage(message))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-grow rounded-l-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleSend}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
