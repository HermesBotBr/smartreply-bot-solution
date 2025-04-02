
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePushNotification } from './use-push-notification';

// Extrai apenas os dados essenciais da subscription para reduzir o tamanho
const extractEssentialSubscriptionData = (subscription: PushSubscription) => {
  if (!subscription) return null;
  
  try {
    const subJSON = subscription.toJSON();
    
    // Garantir que apenas o mínimo necessário seja enviado
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subJSON.keys?.p256dh || '',
        auth: subJSON.keys?.auth || ''
      }
    };
  } catch (error) {
    console.error("Erro ao extrair dados da subscription:", error);
    return null;
  }
};

export const useMessageNotifications = (sellerId: string | null) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const { subscribe, subscription, permission, supported } = usePushNotification();

  // Registrar inscrição de notificações quando o usuário logar
  useEffect(() => {
    if (!sellerId || !supported || permission !== 'granted' || isRegistered || !subscription) return;

    const registerSubscription = async () => {
      try {
        // Extrair apenas os dados essenciais no formato mais compacto possível
        const essentialData = extractEssentialSubscriptionData(subscription);
        
        if (!essentialData) {
          console.error('Falha ao extrair dados da subscription');
          toast.error('Erro ao ativar notificações');
          return;
        }
        
        const response = await fetch('https://projetohermes-dda7e0c8d836.herokuapp.com/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_id: JSON.stringify(essentialData),
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
