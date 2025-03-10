
import { useState } from 'react';
import { useToast } from "./use-toast";

export function useSaleDetails() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const { toast } = useToast();

  const fetchSaleDetails = async (selectedConv: any, token: string) => {
    try {
      const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${token.trim()}`);
      const orderData = await orderResponse.json();
      setOrderDetails(orderData);
      if(orderData.shipping && orderData.shipping.id) {
        const shippingResponse = await fetch(`https://api.mercadolibre.com/shipments/${orderData.shipping.id}?access_token=${token.trim()}`);
        const shippingData = await shippingResponse.json();
        setShippingDetails(shippingData);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da venda:", error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível obter informações desta venda",
        variant: "destructive",
      });
    }
  };

  const fetchDetailedInfo = async (selectedConv: any, token: string) => {
    try {
      let orderResponse = await fetch(`https://api.mercadolibre.com/orders/${selectedConv.orderId}?access_token=${token.trim()}`);
      let detailedData = await orderResponse.json();
      
      if (detailedData.error === "order_not_found") {
        const packResponse = await fetch(`https://api.mercadolibre.com/packs/${selectedConv.orderId}?access_token=${token.trim()}`);
        const packData = await packResponse.json();
        if (packData.orders && packData.orders.length > 0) {
          const correctOrderId = packData.orders[0].id;
          orderResponse = await fetch(`https://api.mercadolibre.com/orders/${correctOrderId}?access_token=${token.trim()}`);
          detailedData = await orderResponse.json();
        }
      }
      
      setDetailedInfo(detailedData);
      setExpandedInfo(true);
    } catch (error) {
      console.error("Erro ao carregar informações detalhadas:", error);
      toast({
        title: "Erro ao carregar informações",
        description: "Não foi possível obter informações detalhadas",
        variant: "destructive",
      });
    }
  };

  return {
    orderDetails,
    shippingDetails,
    expandedInfo,
    setExpandedInfo,
    detailedInfo,
    fetchDetailedInfo,
    showSaleDetails,
    setShowSaleDetails,
    fetchSaleDetails
  };
}
