
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePushNotification } from './use-push-notification';

// Função para compactar o objeto de subscription antes de enviar
const compactSubscription = (subscription: PushSubscription) => {
  if (!subscription) return null;
  
  // Extrair apenas os dados essenciais da subscription
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys?.p256dh,
      auth: subscription.toJSON().keys?.auth
    }
  };
};

export const useMessageNotifications = (sellerId: string | null) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const { subscribe, subscription, permission, supported } = usePushNotification();

  // Registrar inscrição de notificações quando o usuário logar
  useEffect(() => {
    if (!sellerId || !supported || permission !== 'granted' || isRegistered || !subscription) return;

    const registerSubscription = async () => {
      try {
        // Usar o formato compacto da subscription
        const compactedSubscription = compactSubscription(subscription);
        
        const response = await fetch('https://projetohermes-dda7e0c8d836.herokuapp.com/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_id: JSON.stringify(compactedSubscription),
            seller_id: sellerId
          }),
        });

        if (response.ok) {
          console.log('Subscription cadastrada com sucesso para seller_id:', sellerId);
          setIsRegistered(true);
          toast.success('Notificações ativadas com sucesso');
        } else {
          console.error('Erro ao cadastrar subscription:', await response.text());
          toast.error('Erro ao ativar notificações');
        }
      } catch (error) {
        console.error('Erro ao registrar subscription:', error);
        toast.error('Erro ao ativar notificações');
      }
    };

    registerSubscription();
  }, [sellerId, subscription, permission, supported, isRegistered]);

  // Solicitar permissão de notificação quando o usuário logar
  useEffect(() => {
    if (!sellerId || !supported || isRegistered) return;
    
    const requestNotificationPermission = async () => {
      try {
        await subscribe();
      } catch (error) {
        console.error('Erro ao solicitar permissão para notificações:', error);
      }
    };

    // Pequeno delay para não competir com outras operações de login
    const timeoutId = setTimeout(() => {
      requestNotificationPermission();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [sellerId, supported, subscribe, isRegistered]);

  return { isRegistered };
};
