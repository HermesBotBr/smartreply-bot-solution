import React, { useRef, useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateFormatters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllGptData } from '@/hooks/useAllGptData';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';
import { useMlToken } from '@/hooks/useMlToken';
import { uploadFile } from '@/utils/fileUpload';

interface Message {
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

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sellerId: string | null;
  packId: string | null;
  onMessageSent?: () => void;
}

const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  isLoading, 
  error, 
  sellerId,
  packId,
  onMessageSent
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const displayedMessageIdsRef = useRef<Set<string>>(new Set());
  const mlToken = useMlToken(sellerId);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const { gptMessageIds } = useAllGptData(sellerId);

  useEffect(() => {
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        displayedMessageIdsRef.current.add(msg.id);
      });
    }
  }, [messages]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const wasMessageAdded = messages.length > prevMessagesLengthRef.current;
      
      if (wasMessageAdded) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const sellerIdNum = sellerId ? parseInt(sellerId, 10) : null;

  const getAttachmentUrl = (filename: string): string => {
    if (!filename || !filename.trim()) return '';
    
    const tokenParam = mlToken ? `&access_token=${mlToken}` : '';
    
    return `https://api.mercadolibre.com/messages/attachments/${filename.trim()}?site_id=MLB${tokenParam}`;
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !sellerId || !packId) {
      return;
    }

    setSending(true);
    try {
      let attachmentUrl = '';
      
      if (selectedFile) {
        setUploadingFile(true);
        try {
          attachmentUrl = await uploadFile(selectedFile);
          console.log("Uploaded file URL:", attachmentUrl);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Erro ao enviar o arquivo");
          setSending(false);
          setUploadingFile(false);
          return;
        }
        setUploadingFile(false);
      }

      const finalMessageText = selectedFile
        ? messageText.trim()
          ? `${messageText}\n\nAnexo: ${window.location.origin}${attachmentUrl}`
          : `Anexo: ${window.location.origin}${attachmentUrl}`
        : messageText;

      const response = await axios.post(getNgrokUrl('/enviamsg'), {
        seller_id: sellerId,
        pack_id: packId,
        text: finalMessageText
      });

      toast.success("Mensagem enviada com sucesso");
      setMessageText('');
      setSelectedFile(null);
      setFilePreview(null);
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O arquivo é muito grande. O tamanho máximo é 5MB.");
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
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = (imageUrl: string, errorEvent: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Failed to load image:", imageUrl, errorEvent);
    setFailedImages(prev => new Set(prev).add(imageUrl));
    if (!failedImages.has(imageUrl)) {
      toast.error("Não foi possível carregar uma imagem. Tente recarregar a página.");
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhuma mensagem encontrada para esta conversa</p>
      </div>
    );
  }

  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach((message) => {
    const date = formatDate(message.message_date.created);
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.entries(messagesByDate).map((dateEntry) => (
            <div key={dateEntry[0]}>
              <div className="flex justify-center my-3">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  {dateEntry[0]}
                </div>
              </div>
              
              {dateEntry[1].map((message) => {
                const isSeller = message.from.user_id === sellerIdNum;
                const isGptMessage = isSeller && gptMessageIds.includes(message.id);
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isSeller ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div 
                      className={`rounded-lg p-3 max-w-[70%] shadow-sm ${
                        isSeller 
                          ? isGptMessage 
                            ? 'bg-blue-100 text-gray-800'
                            : 'bg-green-100 text-gray-800'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      {message.message_attachments && message.message_attachments.length > 0 && (
                        <div className="mb-2">
                          {message.message_attachments.map((attachment, idx) => {
                            if (attachment.filename && attachment.filename.trim()) {
                              const attachmentUrl = getAttachmentUrl(attachment.filename);
                              
                              if (failedImages.has(attachmentUrl)) {
                                return (
                                  <div key={idx} className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-500">
                                    [Imagem indisponível]
                                  </div>
                                );
                              }
                              
                              return (
                                <div 
                                  key={idx}
                                  className="mb-2 cursor-pointer" 
                                  onClick={() => setFullScreenImage(attachmentUrl)}
                                >
                                  <img
                                    src={attachmentUrl}
                                    alt={`Anexo ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded"
                                    onError={(e) => handleImageError(attachmentUrl, e)}
                                    loading="lazy"
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {new Date(message.message_date.created).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
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
        </div>
      )}
      
      <div className="p-3 bg-white border-t sticky bottom-0">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFile}
            className="flex-shrink-0"
            title="Anexar arquivo"
          >
            <Paperclip size={18} />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          <Input 
            placeholder="Digite sua mensagem..." 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!packId || sending || uploadingFile}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSendMessage} 
            disabled={(!messageText.trim() && !selectedFile) || !packId || sending || uploadingFile} 
            className="flex-shrink-0"
          >
            {sending || uploadingFile ? (
              <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full" />
            ) : (
              <Send size={18} className="mr-1" />
            )}
            {uploadingFile ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
      
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={fullScreenImage} 
              alt="Imagem ampliada" 
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onError={(e) => {
                console.error("Erro ao carregar imagem em tela cheia:", e);
                setFullScreenImage(null);
                toast.error("Não foi possível carregar a imagem");
              }}
            />
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black"
              onClick={() => setFullScreenImage(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesList;
