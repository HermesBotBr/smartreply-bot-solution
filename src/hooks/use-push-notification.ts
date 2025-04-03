
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Chave pública VAPID para identificar o servidor que envia as notificações
// Essa chave deve corresponder à chave pública definida no servidor
const PUBLIC_VAPID_KEY = 'BPdifDqItbFmUtgI1PjwhcwjQUKXUZDFYFX95rBC9K6_NlAjMkhoVbKd2Ivm8f5rHUYFfMC4tvxaMtbovaTJr6A';

export function usePushNotification() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);

  // Logs para depuração
  useEffect(() => {
    console.log('VAPID Public Key being used for subscription:', PUBLIC_VAPID_KEY);
  }, []);

  // Verifica se o navegador suporta notificações push
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      console.warn('Notificações push não são suportadas neste navegador');
      return;
    }

    // Verificar a permissão atual
    setPermission(Notification.permission);
  }, []);

  // Registra o service worker
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    try {
      return await navigator.serviceWorker.register('/service-worker.js');
    } catch (error) {
      console.error('Erro ao registrar service worker:', error);
      throw new Error('Falha ao registrar service worker');
    }
  };

  // Solicita permissão e assina as notificações push
  const subscribe = async (): Promise<PushSubscription | null> => {
    try {
      setLoading(true);

      // Solicitar permissão para notificações
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa aceitar as notificações para receber alertas',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      // Registrar service worker se ainda não estiver registrado
      const registration = await registerServiceWorker();

      // Verificar se já existe uma subscrição
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Usando subscription existente:', existingSubscription.endpoint?.substring(0, 50) + '...');
        setSubscription(existingSubscription);
        setLoading(false);
        return existingSubscription;
      }

      // Criar nova subscrição
      const vapidKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      console.log('Criando nova subscription com a chave VAPID:', PUBLIC_VAPID_KEY);
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      console.log('Nova subscription criada:', newSubscription.endpoint?.substring(0, 50) + '...');
      
      if (newSubscription.keys) {
        console.log('Keys disponíveis:', Object.keys(newSubscription.keys).join(', '));
      }

      setSubscription(newSubscription);
      setLoading(false);
      
      return newSubscription;
    } catch (error) {
      console.error('Erro ao assinar notificações push:', error);
      setLoading(false);
      return null;
    }
  };

  // Função para desinscrever das notificações
  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const success = await subscription.unsubscribe();
      if (success) {
        setSubscription(null);
      }
      return success;
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      return false;
    }
  };

  return {
    subscribe,
    unsubscribe,
    subscription,
    permission,
    loading,
    supported,
  };
}

// Função auxiliar para converter a chave VAPID para o formato correto
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
