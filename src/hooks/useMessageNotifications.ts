
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePushNotification } from './use-push-notification';

const extractFullSubscriptionData = (subscription: PushSubscription) => {
  if (!subscription) return null;
  
  try {
    // Capturar todos os dados da subscription, não apenas os essenciais
    const fullSubscriptionData = subscription.toJSON();
    
    return JSON.stringify(fullSubscriptionData);
  } catch (error) {
    console.error("Erro ao extrair dados completos da subscription:", error);
    return null;
  }
};

export const useMessageNotifications = (sellerId: string | null) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const { subscribe, subscription, permission, supported } = usePushNotification();

  useEffect(() => {
    if (!sellerId || !supported || permission !== 'granted' || isRegistered || !subscription) return;

    const registerSubscription = async () => {
      try {
        // Extrair dados completos da subscription
        const fullSubscriptionData = extractFullSubscriptionData(subscription);
        
        if (!fullSubscriptionData) {
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
            subscription_id: fullSubscriptionData,
            seller_id: sellerId
          }),
        });

        if (response.ok) {
          console.log('Subscription completa cadastrada com sucesso para seller_id:', sellerId);
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
