import React, { useRef, useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateFormatters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllGptData } from '@/hooks/useAllGptData';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';
import { useMlToken } from '@/hooks/useMlToken';
import { uploadFile } from '@/utils/fileUpload';
import { usePackClientData, ClientData } from '@/hooks/usePackClientData';
import { Complaint } from '@/hooks/usePackFilters';

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

interface ComplaintMessage {
  sender_role: string;
  receiver_role: string;
  message: string;
  translated_message: string | null;
  date_created: string;
  last_updated: string;
  message_date: string;
  date_read: string;
  attachments: any[];
  status: string;
  stage: string;
  message_moderation: {
    status: string;
    reason: string;
    source: string;
    date_moderated: string;
  };
  repeated: boolean;
  hash: string;
}

interface MessagesListProps {
  messages: Message[];
  complaintMessages?: ComplaintMessage[];
  isLoading: boolean;
  error: string | null;
  sellerId: string | null;
  packId: string | null;
  onMessageSent?: () => void;
  clientData?: ClientData | null;
  onHeaderClick?: () => void;
  isComplaint?: boolean;
  complaintData?: Complaint;
}

const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  complaintMessages = [],
  isLoading, 
  error, 
  sellerId,
  packId,
  onMessageSent,
  clientData,
  onHeaderClick,
  isComplaint = false,
  complaintData
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
          if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
            try {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
              console.warn("Erro ao executar scrollIntoView:", err);
            }
          }
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

      const baseUrl = window.location.origin;
      const finalAttachmentUrl = attachmentUrl ? (attachmentUrl.startsWith('http') ? attachmentUrl : `${baseUrl}${attachmentUrl}`) : '';
      
      const finalMessageText = selectedFile
        ? messageText.trim()
          ? `${messageText}\n\nAnexo: ${finalAttachmentUrl}`
          : `Anexo: ${finalAttachmentUrl}`
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

  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  };

  const extractUrlFromText = (text: string): string | null => {
    if (!text) return null;
    
    const anexoMatch = text.match(/Anexo:\s*(https?:\/\/[^\s]+)/i);
    if (anexoMatch && anexoMatch[1]) {
      return anexoMatch[1];
    }
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  };

  const renderMessageText = (text: string) => {
    const extractedUrl = extractUrlFromText(text);
    const isImageUrl = extractedUrl && (
      extractedUrl.match(/\.(jpeg|jpg|gif|png)$/) || 
      extractedUrl.includes('/uploads/')
    );
    
    if (isImageUrl) {
      const textWithoutUrl = text.replace(extractedUrl, '').replace(/Anexo:\s*/i, '').trim();
      
      return (
        <>
          {textWithoutUrl && <p className="whitespace-pre-wrap mb-2">{textWithoutUrl}</p>}
          <div className="mb-2">
            <img 
              src={extractedUrl} 
              alt="Imagem anexada" 
              className="max-w-full rounded max-h-60 object-contain cursor-pointer"
              onClick={() => setFullScreenImage(extractedUrl)}
              onError={(e) => {
                console.error("Error loading attachment image:", e);
                (e.target as HTMLImageElement).style.display = 'none';
                toast.error("Não foi possível carregar a imagem anexada");
              }}
            />
          </div>
        </>
      );
    }
    
    return <p className="whitespace-pre-wrap">{text}</p>;
  };

  const renderHeader = () => {
    if (isComplaint && complaintData) {
      return (
        <div 
          className={`p-4 border-b bg-white ${onHeaderClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={onHeaderClick}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Reclamação #{complaintData.claim_id}</h3>
              <p className="text-sm text-gray-700">{complaintData.motivo_reclamacao}</p>
              <p className="text-xs text-gray-500">
                {formatDate(complaintData.data_criada)} - Afetou reputação: {complaintData.afetou_reputacao}
              </p>
            </div>
            {onHeaderClick && <ChevronRight size={18} className="text-gray-400" />}
          </div>
        </div>
      );
    }

    const clientName = clientData ? (clientData["Nome completo do cliente"] || clientData["Nickname do cliente"] || "Cliente") : "Cliente";
    const productTitle = clientData ? (clientData["Título do anúncio"] || "Produto não identificado") : "Produto não identificado";
    
    return (
      <div 
        className={`p-4 border-b bg-white ${onHeaderClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={onHeaderClick}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{clientName}</h3>
            <p className="text-sm text-gray-700">{productTitle}</p>
            <p className="text-xs text-gray-500">
              {isLoading ? 'Carregando mensagens...' :
                error ? 'Erro ao carregar mensagens' :
                `${messages.length} mensagens`}
            </p>
          </div>
          {onHeaderClick && <ChevronRight size={18} className="text-gray-400" />}
        </div>
      </div>
    );
  };

  const processComplaintMessages = (): Message[] => {
    if (!complaintMessages || complaintMessages.length === 0) return [];
    
    return complaintMessages.map((cmsg, index) => {
      const isSeller = cmsg.sender_role === 'respondent';
      
      return {
        id: `complaint-${cmsg.hash || index}`,
        from: { 
          user_id: isSeller ? (sellerIdNum || 0) : -1
        },
        to: { 
          user_id: isSeller ? -1 : (sellerIdNum || 0)
        },
        text: cmsg.message,
        message_date: {
          received: cmsg.date_created,
          available: cmsg.date_created,
          created: cmsg.message_date,
          read: cmsg.date_read || cmsg.date_created
        },
        message_attachments: cmsg.attachments.length > 0 ? 
          cmsg.attachments.map(att => ({
            filename: att.url,
            original_filename: att.name || 'attachment',
            status: 'available'
          })) : null
      };
    });
  };

  if (isLoading && messages.length === 0 && complaintMessages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && messages.length === 0 && complaintMessages.length === 0) {
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

  if (messages.length === 0 && complaintMessages.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhuma mensagem encontrada para esta conversa</p>
      </div>
    );
  }

  const allMessages = [...messages, ...processComplaintMessages()];
  
  allMessages.sort((a, b) => 
    new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
  );

  const messagesByDate: Record<string, Message[]> = {};
  allMessages.forEach((message) => {
    const date = formatDate(message.message_date.created);
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      {renderHeader()}
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isComplaint && complaintData && (
            <div className="my-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-700">Detalhes da Reclamação</h4>
              <p className="text-sm text-orange-700 mt-1">Motivo: {complaintData.motivo_reclamacao}</p>
              <p className="text-sm text-orange-700">Pedido: {complaintData.order_id}</p>
              <p className="text-sm text-orange-700">ID da Reclamação: {complaintData.claim_id}</p>
              <p className="text-sm text-orange-700">Data: {new Date(complaintData.data_criada).toLocaleDateString()}</p>
              <p className="text-sm text-orange-700">Afetou Reputação: {complaintData.afetou_reputacao}</p>
            </div>
          )}

          {complaintMessages.length > 0 && (
            <div className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <p className="text-sm text-yellow-700">
                Exibindo {complaintMessages.length} mensagens da reclamação e {messages.length} mensagens da venda
              </p>
            </div>
          )}

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
                      
                      {renderMessageText(message.text)}
                      
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
      
      {!isComplaint && (
        <>
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
                  <Loader2 size={18} className="mr-1 animate-spin" />
                ) : (
                  <Send size={18} className="mr-1" />
                )}
                {uploadingFile ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </>
      )}
      
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
