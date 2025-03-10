
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { usePushNotification } from "@/hooks/use-push-notification";
import { toast } from "@/hooks/use-toast";

const NotificationPermission: React.FC = () => {
  const { 
    subscribe, 
    unsubscribe, 
    permission, 
    loading, 
    supported, 
    subscription 
  } = usePushNotification();

  const handleSubscribe = async () => {
    try {
      const result = await subscribe();
      if (result) {
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações quando um cliente solicitar atendimento',
        });
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: 'Erro ao ativar notificações',
        description: 'Não foi possível ativar as notificações',
        variant: 'destructive',
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const result = await unsubscribe();
      if (result) {
        toast({
          title: 'Notificações desativadas',
          description: 'Você não receberá mais notificações',
        });
      }
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
    }
  };

  if (!supported) {
    return (
      <Button variant="outline" size="sm" disabled>
        <BellOff size={16} className="mr-2" />
        Notificações não suportadas
      </Button>
    );
  }

  if (permission === 'granted' && subscription) {
    return (
      <Button variant="outline" size="sm" onClick={handleUnsubscribe} className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200">
        <BellOff size={16} className="mr-2" />
        Desativar notificações
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSubscribe} 
      disabled={loading}
      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
    >
      <Bell size={16} className="mr-2" />
      {loading ? 'Ativando...' : 'Ativar notificações'}
    </Button>
  );
};

export default NotificationPermission;
