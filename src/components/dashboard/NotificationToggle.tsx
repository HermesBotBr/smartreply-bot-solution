
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePushNotification } from "@/hooks/use-push-notification";
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";

interface NotificationToggleProps {
  sellerId: string | null;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ sellerId }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { 
    subscribe, 
    unsubscribe, 
    permission, 
    subscription, 
    supported 
  } = usePushNotification();

  useEffect(() => {
    if (sellerId) {
      fetchNotificationStatus();
    }
  }, [sellerId]);

  const fetchNotificationStatus = async () => {
    if (!sellerId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(getNgrokUrl('/api/db/rows/config'));
      
      if (response.data && Array.isArray(response.data.rows)) {
        const sellerConfig = response.data.rows.find((config: any) => 
          config.seller_id === sellerId
        );
        
        if (sellerConfig) {
          setNotificationsEnabled(sellerConfig.notifica === 'on');
        } else {
          console.log("Não foram encontradas configurações para este vendedor, usando padrão 'on'");
          setNotificationsEnabled(true);
        }
      } else {
        console.error("Formato de dados inválido na resposta da API");
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível verificar o status das notificações",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível verificar o status das notificações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!sellerId) return;
    
    setIsLoading(true);
    
    try {
      // Atualizar o estado local imediatamente para feedback ao usuário
      setNotificationsEnabled(enabled);
      
      // Enviar atualização para o servidor
      await axios.post(getNgrokUrl('/notifica'), {
        seller_id: sellerId,
        notifica: enabled ? "on" : "off"
      });
      
      // Lidar com a assinatura de push notification
      if (enabled) {
        if (permission !== 'granted' || !subscription) {
          await subscribe();
        }
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações quando houver novas mensagens"
        });
      } else {
        if (subscription) {
          await unsubscribe();
        }
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificação:", error);
      
      // Reverter o estado local em caso de erro
      setNotificationsEnabled(!enabled);
      
      toast({
        title: "Erro ao atualizar notificações",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center space-x-2 opacity-70">
        <Bell size={16} />
        <span className="text-sm">Notificações não suportadas</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="notification-toggle"
        checked={notificationsEnabled}
        onCheckedChange={handleToggleNotifications}
        disabled={isLoading}
      />
      <Label htmlFor="notification-toggle" className="text-sm cursor-pointer">
        <div className="flex items-center space-x-1">
          <Bell size={16} />
          <span>{isLoading ? "Carregando..." : (notificationsEnabled ? "Notificações ativadas" : "Notificações desativadas")}</span>
        </div>
      </Label>
    </div>
  );
};

export default NotificationToggle;
