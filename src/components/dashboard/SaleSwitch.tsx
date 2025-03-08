
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SaleSwitchProps {
  orderId: string;
}

const SaleSwitch: React.FC<SaleSwitchProps> = ({ orderId }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSwitchState = async () => {
      try {
        const response = await fetch('https://735e1872650f.ngrok.app/switch');
        const data = await response.json();
        if (data.pack_ids && data.pack_ids.includes(orderId.toString())) {
          setIsEnabled(false);
        } else {
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Erro ao buscar estado do switch:", error);
      }
    };
    fetchSwitchState();
  }, [orderId]);

  const toggleSwitch = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    try {
      if (!newValue) {
        const response = await fetch('https://735e1872650f.ngrok.app/switch/off', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack_id: orderId })
        });
        const json = await response.json();
        console.log("Switch off response", json);
        toast({
          title: "Atendimento automático desativado",
          description: `Pedido #${orderId}`,
        });
      } else {
        const response = await fetch(`https://735e1872650f.ngrok.app/switch/on/${orderId}`, {
          method: 'DELETE'
        });
        const json = await response.json();
        console.log("Switch on response", json);
        toast({
          title: "Atendimento automático ativado",
          description: `Pedido #${orderId}`,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar switch", error);
      toast({
        title: "Erro ao atualizar atendimento",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  return (
    <Switch
      checked={isEnabled}
      onCheckedChange={toggleSwitch}
    />
  );
};

export default SaleSwitch;
