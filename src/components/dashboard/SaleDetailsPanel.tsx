
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import ProductThumbnail from './ProductThumbnail';
import Timeline from './Timeline';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

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

  // Mark conversation as read when panel is opened
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
            <div className="w-5"></div> {/* Empty div for flex alignment */}
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
