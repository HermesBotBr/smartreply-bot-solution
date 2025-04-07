
import React from 'react';
import { X, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClientData } from '@/hooks/usePackClientData';
import { formatCurrency } from '@/utils/formatters';

interface SaleDetailsPanelProps {
  saleDetails: ClientData | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  isMobile: boolean;
}

const SaleDetailsPanel: React.FC<SaleDetailsPanelProps> = ({
  saleDetails,
  isLoading,
  error,
  onClose,
  isMobile
}) => {
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data não disponível";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

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
            <div className="w-5"></div> {/* Spacer for alignment */}
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
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={onClose}
              className="text-blue-500 hover:underline"
            >
              Voltar
            </button>
          </div>
        ) : !saleDetails ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            Nenhum detalhe disponível
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Order Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                  <span>Informações do pedido</span>
                  {saleDetails.Order_id && (
                    <a 
                      href={`https://www.mercadolibre.com.br/vendas/${saleDetails.Order_id}/detalhe`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                    >
                      <span className="mr-1">Ver no ML</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Pedido:</p>
                  <p>{saleDetails.Order_id || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Data da venda:</p>
                  <p>{formatDate(saleDetails["Data da venda"])}</p>
                </div>
                <div>
                  <p className="font-medium">Valor:</p>
                  <p>{saleDetails["Valor da venda"] ? formatCurrency(saleDetails["Valor da venda"]) : "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Status de entrega:</p>
                  <p>{saleDetails["Status de entrega"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Reclamação aberta?</p>
                  <p className={saleDetails["Reclamação aberta?"] === "Sim" ? "text-red-500 font-medium" : ""}>
                    {saleDetails["Reclamação aberta?"] || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informações do produto</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Produto:</p>
                  <p>{saleDetails["Título do anúncio"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">ID do anúncio:</p>
                  <p>{saleDetails["MLB do anúncio"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Cor:</p>
                  <p>{saleDetails["Cor"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Garantia:</p>
                  <p>{saleDetails["Garantia"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Quantidade:</p>
                  <p>{saleDetails["Quantidade"] || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informações do cliente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Nome:</p>
                  <p>{saleDetails["Nome completo do cliente"] || saleDetails["Nickname do cliente"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Nickname:</p>
                  <p>{saleDetails["Nickname do cliente"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">ID do comprador:</p>
                  <p>{saleDetails["Buyer_id"] || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping/Payment Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informações adicionais</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">ID do pagamento:</p>
                  <p>{saleDetails["ID do pagamento"] || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">ID do envio:</p>
                  <p>{saleDetails["Shipping_id"] || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDetailsPanel;
