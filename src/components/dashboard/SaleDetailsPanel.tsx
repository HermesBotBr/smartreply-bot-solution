import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, RotateCcw, Box } from "lucide-react";
import ProductThumbnail from './ProductThumbnail';
import Timeline from './Timeline';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { getNgrokUrl } from '@/config/api';

interface SaleDetailsPanelProps {
  selectedConv: any;
  orderDetails: any;
  shippingDetails: any;
  expandedInfo: boolean;
  setExpandedInfo: (expanded: boolean) => void;
  detailedInfo: any;
  fetchDetailedInfo: () => Promise<void>;
  onClose: () => void;
  markAsRead: (orderId: string) => Promise<void>;
  isMobile: boolean;
}

const SaleDetailsPanel: React.FC<SaleDetailsPanelProps> = ({
  selectedConv,
  orderDetails,
  shippingDetails,
  expandedInfo,
  setExpandedInfo,
  detailedInfo,
  fetchDetailedInfo,
  onClose,
  markAsRead,
  isMobile
}) => {
  const { toast } = useToast();
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [creatingReverseShipment, setCreatingReverseShipment] = useState(false);
  const [creatingRegularShipment, setCreatingRegularShipment] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const markConversationAsRead = async () => {
      if (selectedConv && selectedConv.orderId && !markingAsRead) {
        setMarkingAsRead(true);
        try {
          await markAsRead(selectedConv.orderId);
          console.log(`Conversation ${selectedConv.orderId} marked as read from SaleDetailsPanel`);
        } catch (error) {
          console.error("Error marking conversation as read from SaleDetailsPanel:", error);
          // Not showing toast here since it will be handled in the markAsRead function
        } finally {
          setMarkingAsRead(false);
        }
      }
    };
    
    markConversationAsRead();
  }, [selectedConv, markAsRead]);

  const handleCreateReverseShipment = async () => {
    if (!selectedConv || !selectedConv.orderId) {
      toast({
        title: "Erro",
        description: "Informações insuficientes para criar envio reverso",
        variant: "destructive",
      });
      return;
    }

    setCreatingReverseShipment(true);
    
    try {
      let buyerId = selectedConv.buyerId;
      
      if (!buyerId) {
        const mlTokenResponse = await fetch(getNgrokUrl('mercadoLivreApiKey.txt'));
        const mlToken = await mlTokenResponse.text();
        
        const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${mlToken.trim()}`);
        const orderData = await orderResponse.json();
        
        if (orderData.error) {
          throw new Error(`Erro ao obter informações do pedido: ${orderData.error}`);
        }
        
        if (!orderData.buyer || !orderData.buyer.id) {
          throw new Error('Não foi possível encontrar o ID do comprador');
        }
        
        buyerId = orderData.buyer.id;
      }
      
      const response = await fetch(getNgrokUrl('/ep242024'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: selectedConv.orderId,
          buyerId: buyerId,
          msgId: "12345"
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Envio reverso criado com sucesso",
        });
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao criar envio reverso');
      }
    } catch (error) {
      console.error("Erro ao criar envio reverso:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar envio reverso",
        variant: "destructive",
      });
    } finally {
      if (isMounted.current) {
        setCreatingReverseShipment(false);
      }
    }
  };

  const handleCreateRegularShipment = async () => {
    if (!selectedConv || !selectedConv.orderId) {
      toast({
        title: "Erro",
        description: "Informações insuficientes para criar envio comum",
        variant: "destructive",
      });
      return;
    }

    setCreatingRegularShipment(true);
    
    try {
      let buyerId = selectedConv.buyerId;
      
      if (!buyerId) {
        const mlTokenResponse = await fetch(getNgrokUrl('mercadoLivreApiKey.txt'));
        const mlToken = await mlTokenResponse.text();
        
        const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${mlToken.trim()}`);
        const orderData = await orderResponse.json();
        
        if (orderData.error) {
          throw new Error(`Erro ao obter informações do pedido: ${orderData.error}`);
        }
        
        if (!orderData.buyer || !orderData.buyer.id) {
          throw new Error('Não foi possível encontrar o ID do comprador');
        }
        
        buyerId = orderData.buyer.id;
      }
      
      const response = await fetch(getNgrokUrl('/protocol252025'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pack_id: selectedConv.orderId,
          buyer_id: buyerId
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Envio comum criado com sucesso",
        });
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao criar envio comum');
      }
    } catch (error) {
      console.error("Erro ao criar envio comum:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar envio comum",
        variant: "destructive",
      });
    } finally {
      if (isMounted.current) {
        setCreatingRegularShipment(false);
      }
    }
  };

  if (!selectedConv) {
    return null;
  }

  return (
    <div className="h-full flex flex-col border-l border-gray-300">
      <div className="bg-primary text-white p-3 flex items-center justify-between">
        {isMobile ? (
          <>
            <button 
              onClick={onClose}
              className="text-white"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold">Detalhes da venda</h2>
            <div className="w-5"></div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">Detalhes da venda</h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-primary-dark rounded-full p-1"
              aria-label="Fechar detalhes da venda"
            >
              <X size={20} />
            </button>
          </>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
        {!orderDetails ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <a
              href={`https://www.mercadolibre.com.br/vendas/${orderDetails.id}/detalhe`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <Card className="relative cursor-pointer">
                <img 
                  src="https://http2.mlstatic.com/static/org-img/homesnw/mercado-libre.png?v=2"
                  alt="Mercado libre"
                  className="absolute top-4 right-4 w-20 h-auto"
                />
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detalhes da venda</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-800 text-sm mb-2">Venda: #{orderDetails.id}</p>
                  <div className="flex items-center">
                    <ProductThumbnail itemId={orderDetails.order_items && orderDetails.order_items[0]?.item?.id} />
                    <p className="ml-3 font-medium text-sm">
                      {orderDetails.order_items && orderDetails.order_items[0]?.item?.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </a>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rastreamento de envio</CardTitle>
              </CardHeader>
              <CardContent>
                {shippingDetails ? (
                  <Timeline status={shippingDetails.status} />
                ) : (
                  <p className="text-sm">Sem informações de envio.</p>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full text-sm"
              variant="secondary"
              size="sm"
              onClick={handleCreateReverseShipment}
              disabled={creatingReverseShipment}
            >
              {creatingReverseShipment ? (
                <>
                  <span className="animate-spin mr-2">
                    <RotateCcw size={16} />
                  </span>
                  Criando envio reverso...
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  Criar envio reverso
                </>
              )}
            </Button>
            
            <Button
              className="w-full text-sm"
              variant="secondary"
              size="sm"
              onClick={handleCreateRegularShipment}
              disabled={creatingRegularShipment}
            >
              {creatingRegularShipment ? (
                <>
                  <span className="animate-spin mr-2">
                    <Box size={16} />
                  </span>
                  Criando envio comum...
                </>
              ) : (
                <>
                  <Box size={16} />
                  Criar envio comum
                </>
              )}
            </Button>
            
            <Button
              className="w-full text-sm"
              size="sm"
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Informações detalhadas</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-auto text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Data da compra:</p>
                      <p>{formatDateTime(detailedInfo.date_created)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total:</p>
                      <p>{formatCurrency(detailedInfo.total_amount)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Status de pagamento:</p>
                      <p>{detailedInfo.payments?.[0]?.status || "(não informado)"}</p>
                    </div>
                    {detailedInfo.shipping && (
                      <>
                        <div>
                          <p className="font-medium">Endereço de entrega:</p>
                          <p>
                            {[
                              detailedInfo.shipping.receiver_address?.street_name,
                              detailedInfo.shipping.receiver_address?.street_number,
                              detailedInfo.shipping.receiver_address?.comment,
                              detailedInfo.shipping.receiver_address?.city?.name,
                              detailedInfo.shipping.receiver_address?.state?.name,
                              detailedInfo.shipping.receiver_address?.zip_code
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Nome do destinatário:</p>
                          <p>{detailedInfo.shipping.receiver_address?.receiver_name || "(não informado)"}</p>
                        </div>
                      </>
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

export default SaleDetailsPanel;
